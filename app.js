document.addEventListener('DOMContentLoaded', () => {
    // 初始化VexFlow渲染器
    const canvas = document.getElementById('staff-canvas');
    const renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    renderer.resize(1000, 200);
    const context = renderer.getContext();
    const stave = new Vex.Flow.Stave(50, 0, 900);
    stave.addClef('treble').setContext(context).draw();

    // 音频上下文和音高检测
    let audioContext;
    let pitchDetector;
    let isRecording = false;
    let mediaStream;
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const feedback = document.getElementById('feedback');

    // 目标音符序列
    let targetNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    let currentNoteIndex = 0;

    // 初始化练习
    function initExercise() {
        renderNotes(targetNotes);
    }

    // 渲染音符到五线谱
    function renderNotes(notes) {
        const notesToDraw = notes.map(note => {
            return new Vex.Flow.StaveNote({
                clef: 'treble',
                keys: [note],
                duration: 'q'
            });
        });

        const voice = new Vex.Flow.Voice({ num_beats: notes.length, beat_value: 4 });
        voice.addTickables(notesToDraw);

        const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 800);
        voice.draw(context, stave);
    }

    // 开始录音和音高检测
    startBtn.addEventListener('click', async () => {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(mediaStream);

            // 初始化aubio音高检测器
            pitchDetector = new Aubio.Pitch('yin', 2048, 512, audioContext.sampleRate);
            pitchDetector.setUnit('midi');
            pitchDetector.setThreshold(0.8);

            const scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);

            scriptProcessor.onaudioprocess = function(e) {
                const input = e.inputBuffer.getChannelData(0);
                const pitch = pitchDetector.do(input);
                const midiNote = Math.round(pitch);
                const noteName = midiToNoteName(midiNote);

                if (noteName && isRecording) {
                    checkNote(noteName);
                }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            isRecording = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            showFeedback('正在监听...', 'info');
        } catch (err) {
            console.error('初始化音频失败:', err);
            showFeedback('无法访问麦克风，请检查权限', 'error');
        }
    });

    // 停止录音
    stopBtn.addEventListener('click', () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        showFeedback('已停止练习', 'info');
    });

    // 检查演奏的音符是否正确
    function checkNote(playedNote) {
        const targetNote = targetNotes[currentNoteIndex];
        if (playedNote === targetNote) {
            showFeedback(`正确! 下一个音符: ${targetNotes[currentNoteIndex + 1] || '完成!'}`,
                'correct');
            currentNoteIndex = (currentNoteIndex + 1) % targetNotes.length;
        } else {
            showFeedback(`错误: 演奏了 ${playedNote}, 应该是 ${targetNote}`, 'incorrect');
        }
    }

    // MIDI转音符名称
    function midiToNoteName(midi) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const note = noteNames[midi % 12];
        return `${note}${octave}`;
    }

    // 显示反馈信息
    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = 'feedback';
        feedback.classList.add(type === 'correct' ? 'correct' : 'incorrect');
        feedback.style.display = 'block';
    }

    // 初始化练习
    initExercise();
});