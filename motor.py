
#!/usr/bin/env python3
import sys
import time
from adafruit_servokit import ServoKit

kit = ServoKit(channels=16)

for ch in range(16):

    kit.servo[ch].set_pulse_width_range(500, 2500)
    kit.servo[ch].actuation_range = 180

# 电机引脚配置
SERVO_CHANNELS = {
    'm1': 0,
    'tail': 1,
    
    

}


    

def set_angle(motor_name, angle):
        if motor_name not in SERVO_CHANNELS:
            print(f"Error：motor {motor_name} not found")
            return False
        ch = SERVO_CHANNELS[motor_name]
        kit.servo[ch].angle = angle
        print(f"{motor_name} 转到 {angle} 度")
        return True

def stop(motor_name):

            if motor_name not in SERVO_CHANNELS:
                return False
            ch = SERVO_CHANNELS[motor_name]
            kit.servo[ch].angle = None
            print(f"{motor_name} 停止")
            return True

def cleanup():
            for ch in SERVO_CHANNELS.values():
                kit.servo[ch].angle = None
            
                print("GPIO cleaned up")

def bite():
    print("执行咬合")
    set_angle('m1', 60)
    time.sleep(0.5)
    set_angle('m1', 0)
    time.sleep(0.3)

def wag_tail(times=3, delay=0.15):
    print("执行摆尾")
    LEFT = 30
    RIGHT = 150
    CENTER = 90
    for _ in range(times):
          set_angle('tail', LEFT)
          time.sleep(delay)
          set_angle('tail', RIGHT)
          time.sleep(delay)
    set_angle('tail', CENTER)
    time.sleep(0.3)

if __name__ == "__main__":
    if len(sys.argv) < 2:
          print("用法:")
          print(" python motor.py <motor> angle <角度>")
          print(" python motor.py <motor> stop")
          print(" python motor.py start")
          print(" python motor.py tail")
          print(" python motor.py cleanup")
          sys.exit(0)

    cmd = sys.argv[1]

    if cmd == 'start':
      bite()
    elif cmd == 'tail':
      wag_tail()
    elif len(sys.argv) >= 4 and sys.argv[2] == 'angle':
      set_angle(cmd, int(sys.argv[3]))
    elif len(sys.argv) >= 3 and sys.argv[2] == 'stop':
      stop(cmd)
    elif cmd == 'cleanup':
      cleanup()
    else:
      print(f"未知命令或参数不足: {sys.argv[1:]}")
    

