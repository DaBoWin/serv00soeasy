import time
import pyautogui
from DrissionPage import ChromiumPage

class CloudflareBypasser:
    def __init__(self, driver: ChromiumPage, max_retries=-1, log=True):
        self.driver = driver
        self.max_retries = max_retries
        self.log = log
        # 检查必要的依赖
        try:
            import pyautogui
            import pyscreeze
            self.automation_available = True
            # 检查 OpenCV 是否可用
            try:
                import cv2
                self.opencv_available = True
            except ImportError:
                self.opencv_available = False
                self.log_message("警告：OpenCV 未安装，将使用精确匹配模式")
        except ImportError:
            self.automation_available = False
            self.opencv_available = False
            self.log_message("警告：PyAutoGUI 或 pyscreeze 未正确安装，自动点击功能将不可用")

    def search_recursively_shadow_root_with_iframe(self,ele):
        if ele.shadow_root:
            if ele.shadow_root.child().tag == "iframe":
                return ele.shadow_root.child()
        else:
            for child in ele.children():
                result = self.search_recursively_shadow_root_with_iframe(child)
                if result:
                    return result
        return None

    def search_recursively_shadow_root_with_cf_input(self,ele):
        if ele.shadow_root:
            if ele.shadow_root.ele("tag:input"):
                return ele.shadow_root.ele("tag:input")
        else:
            for child in ele.children():
                result = self.search_recursively_shadow_root_with_cf_input(child)
                if result:
                    return result
        return None
    
    def locate_cf_button(self):
        button = None
        eles = self.driver.eles("tag:input")
        for ele in eles:
            if "name" in ele.attrs.keys() and "type" in ele.attrs.keys():
                if "turnstile" in ele.attrs["name"] and ele.attrs["type"] == "hidden":
                    button = ele.parent().shadow_root.child()("tag:body").shadow_root("tag:input")
                    break
            
        if button:
            return button
        else:
            # If the button is not found, search it recursively
            self.log_message("Basic search failed. Searching for button recursively.")
            ele = self.driver.ele("tag:body")
            iframe = self.search_recursively_shadow_root_with_iframe(ele)
            if iframe:
                button = self.search_recursively_shadow_root_with_cf_input(iframe("tag:body"))
            else:
                self.log_message("Iframe not found. Button search failed.")
            return button

    def log_message(self, message):
        if self.log:
            print(message)

    def click_verification_button(self):
        if not self.automation_available:
            self.log_message("自动点击功能不可用。请安装必要的依赖。")
            return False
            
        try:
            import os
            self.log_message(f"当前工作目录：{os.getcwd()}")
            button_image_path = 'SCR-20250218-nioq.png'
            
            # 检查图片文件是否存在
            if not os.path.exists(button_image_path):
                self.log_message(f"错误：验证按钮图片文件不存在：{button_image_path}")
                return False
                
            self.log_message("开始查找验证按钮...")
            
            try:
                if self.opencv_available:
                    self.log_message("使用 OpenCV 模糊匹配模式")
                    captcha_location = pyautogui.locateOnScreen(button_image_path, confidence=0.7)
                else:
                    self.log_message("使用精确匹配模式")
                    captcha_location = pyautogui.locateOnScreen(button_image_path)
                    
                self.log_message(f"图片查找结果：{'成功' if captcha_location else '未找到'}")
                
            except Exception as locate_error:
                self.log_message(f"查找按钮图片时出错：{str(locate_error)}")
                self.log_message(f"错误类型：{type(locate_error).__name__}")
                import traceback
                self.log_message(f"详细错误信息：\n{traceback.format_exc()}")
                return False

            if captcha_location:
                try:
                    self.log_message(f"找到验证按钮，位置：{captcha_location}")
                    captcha_center = pyautogui.center(captcha_location)
                    self.log_message(f"计算中心点：{captcha_center}")
                    pyautogui.moveTo(captcha_center.x -200, captcha_center.y-420)
                    self.log_message("移动鼠标完成，准备点击")
                    pyautogui.click()
                    self.log_message("点击完成")
                    return True
                except Exception as click_error:
                    self.log_message(f"执行点击操作时出错：{str(click_error)}")
                    import traceback
                    self.log_message(f"详细错误信息：\n{traceback.format_exc()}")
                    return False
            else:
                self.log_message("未在屏幕上找到验证按钮图像")
                return False

        except Exception as e:
            import traceback
            error_msg = traceback.format_exc()
            self.log_message(f"发生未预期的错误:\n{error_msg}")
            self.log_message(f"错误类型：{type(e).__name__}")
            self.log_message(f"错误信息：{str(e)}")
            return False

    def is_bypassed(self):
        try:
            title = self.driver.title.lower()
            return "just a moment" not in title
        except Exception as e:
            self.log_message(f"Error checking page title: {e}")
            return False

    def bypass(self):
        
        try_count = 0

        while not self.is_bypassed():
            if 0 < self.max_retries + 1 <= try_count:
                self.log_message("Exceeded maximum retries. Bypass failed.")
                break

            self.log_message(f"Attempt {try_count + 1}: Verification page detected. Trying to bypass...")
            self.click_verification_button()

            try_count += 1
            time.sleep(2)

        if self.is_bypassed():
            self.log_message("Bypass successful.")
        else:
            self.log_message("Bypass failed.")
