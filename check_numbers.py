import time
import random
import os
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# ================= 配置区域 =================
INPUT_FILE = "numbers.txt"          
OUTPUT_FILE = "verified_numbers.txt"
CHROME_DATA_PATH = "./chrome_cache" 
# ===========================================

def setup_driver():
    """启动浏览器"""
    print("正在启动浏览器...")
    if not os.path.exists(CHROME_DATA_PATH):
        os.makedirs(CHROME_DATA_PATH)

    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--start-maximized") 
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    current_path = os.getcwd()
    full_data_path = os.path.join(current_path, "chrome_cache")
    chrome_options.add_argument(f"--user-data-dir={full_data_path}")
    chrome_options.add_argument("--profile-directory=Default")
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])

    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        print("请关闭所有 Chrome 窗口后重试！")
        return None

def wait_for_login(driver):
    """检查登录"""
    print("------------------------------------------------")
    print("正在检查登录状态...")
    try:
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[id='pane-side']"))
        )
        print("✅ 已登录，准备开始。")
        time.sleep(2)
        return
    except:
        print("⚠️ 请扫码登录...")
    
    try:
        WebDriverWait(driver, 300).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[id='pane-side']"))
        )
        print("✅ 扫码成功！")
        time.sleep(3)
    except TimeoutException:
        print("超时退出。")
        exit()

def normalize_number(num_str):
    """提取纯数字"""
    return re.sub(r'\D', '', num_str)

def check_number_via_web(driver, number):
    # 强制跳转链接
    url = f"https://web.whatsapp.com/send?phone={number}&text&type=phone_number&app_absent=0"
    driver.get(url)
    
    start_time = time.time()
    # 目标号码的后10位（作为指纹比对）
    target_fingerprint = number[-10:] 
    
    while time.time() - start_time < 25:
        try:
            # 1. 检查【无效弹窗】(最高优先级)
            # 只要看到这个弹窗，立刻判死刑
            invalid_popups = driver.find_elements(By.XPATH, "//*[contains(text(), '通过网址分享的电话号码无效') or contains(text(), 'phone number shared via url is invalid')]")
            if invalid_popups and invalid_popups[0].is_displayed():
                return False, "无效 (弹窗拦截)"

            # 2. 检查【有效特征】+ 【严格的指纹核对】
            # 我们必须确保屏幕上显示的号码，就是我们要查的号码
            headers = driver.find_elements(By.TAG_NAME, "header")
            if headers:
                header_text = headers[0].text
                # 提取 header 里的纯数字
                header_num = normalize_number(header_text)
                
                # 【核心修复】
                # 1. header_num 不能为空（防止空字符串误判）
                # 2. header_num 必须包含目标号码的后10位（确保不是上一个人的缓存）
                # 3. 或者 header_num 虽然没有数字（可能是名字），但输入框明确出现了
                
                input_boxes = driver.find_elements(By.CSS_SELECTOR, "div[contenteditable='true']")
                
                if input_boxes:
                    # 情况A: 标题里有数字，且匹配 -> 完美有效
                    if len(header_num) > 6 and (target_fingerprint in header_num or header_num in number):
                         return True, "有效 (号码匹配)"
                    
                    # 情况B: 标题里没数字（可能是名字），但输入框存在
                    # 为了防止这是上一个人的缓存，我们再等一等，或者检查 url
                    # 如果等待时间超过 5 秒且输入框还在，且没弹窗，姑且认为有效
                    if len(header_num) < 3 and (time.time() - start_time > 5):
                         return True, "有效 (已进入对话)"

        except:
            pass
        
        time.sleep(0.5)

    # 超时没反应
    return False, "无效 (超时/未加载)"

def main():
    try:
        with open(INPUT_FILE, "r", encoding='utf-8') as f:
            content = f.read()
            numbers = list(set(re.findall(r'234\d{10}', content)))
    except:
        print(f"找不到 {INPUT_FILE}")
        return

    print(f"准备检测 {len(numbers)} 个号码...")
    
    driver = setup_driver()
    if not driver: return

    driver.get("https://web.whatsapp.com")
    wait_for_login(driver) 
    
    with open(OUTPUT_FILE, "w") as f:
        f.write("")
    
    for index, number in enumerate(numbers):
        print(f"[{index+1}/{len(numbers)}] {number} ... ", end="", flush=True)
        
        # 每次检测前，稍微停顿
        time.sleep(random.uniform(1.0, 2.0))
        
        is_valid, status = check_number_via_web(driver, number)
        
        if is_valid:
            print(f"✅ {status}")
            with open(OUTPUT_FILE, "a") as f:
                f.write(f"{number}\n")
        else:
            print(f"❌ {status}")

    print("\n完成！")
    driver.quit()

if __name__ == "__main__":
    main()