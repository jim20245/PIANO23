
#!/usr/bin/env python3
import sys
import time
from gpiozero import OutputDevice

# 电机引脚配置
MOTOR_PINS = {
    'm1': 18,
    'm2': 19,
    'm3': 20,
    'm4': 21,

}

#初始化 GPIO
motors = {}
for name, pin in MOTOR_PINS.items():
    motors[name] = OutputDevice(pin, initial_value=False)
    

    def control_motor(motor_name, action):
        if motor_name not in motors:
            print(f"Error：motor {motor_name} not found")
            return False

        motor = motors[motor_name]

        if action == 'on':
            motor.on()
            print(f"{motor_name} ON")
        elif action == 'off':
            motor.off()
            print(f"{motor_name} OFF")
        elif action == 'pulse':
            motor.on()
            print(f"{motor_name} PULSE START")
            time.sleep(0.5)
            motor.off()
            print(f"{motor_name} PULSE END")
        else:
            print(f"Error: unknown action {action}")
            return False

        return True

    def cleanup():
        for motor in motors.values():
            motor.off()
            motor.close()
        print("GPIO cleaned up")

    if __name__ == "__main__":
        if len(sys.argv) >= 3:
            control_motor(sys.argv[1], sys.argv[2])

    #如果传入 cleanup 参数， 则清理 GPIO
    if len(sys.argv) > 1 and sys.argv[1] == 'cleanup':
        cleanup()
    

