// ==UserScript==
// @name         111serv00自动填充表单
// @namespace    https://webproxy.lumiproxy.com/
// @version      0.1
// @description  自动填充注册表单字段
// @author       Dabo
// @match        https://www.serv00.com/offer/create_new_account
// @require      https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 添加邮箱组
    const EMAIL_ADDRESSES = [
        '你的邮箱1',
        '你的邮箱2'
    ];

    // 常见英文名字列表
    const FIRST_NAMES = [
        'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Joseph', 'Thomas', 'Charles', 'Daniel',
        'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
        'Liam', 'Noah', 'Oliver', 'Elijah', 'Lucas', 'Mason', 'Logan', 'Alexander', 'Ethan', 'Jacob',
        'Lily', 'Lucy', 'Sarah', 'Emily', 'Sophie', 'Alice', 'Grace', 'Ruby', 'Chloe', 'Hannah'
    ];

    // 常见英文姓氏列表
    const LAST_NAMES = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Boda', 'Kala', 'Kolo', 'Davis', 'Rodriguez', 'Martinez',
        'Anderson', 'Taylor', 'Thomas', 'Dabo', 'Jackson', 'Martin', 'Lee', 'Plau', 'White', 'Ticket',
        'Wilson', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Solo', 'Young', 'Allen', 'King', 'Wright',
        'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Red', 'Mitchell', 'Parker', 'Collins', 'Mjj', 'AffMan', 'OneMan'
    ];

    // 获取随机邮箱
    function getRandomEmail() {
        return EMAIL_ADDRESSES[Math.floor(Math.random() * EMAIL_ADDRESSES.length)];
    }

    // 生成随机字符串（5个字母）
    function generateRandomString() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    }

    // 生成随机名字
    function generateRandomName() {
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        return {
            firstName,
            lastName
        };
    }

    // 生成随机邮箱
    function generateRandomEmail(firstName, lastName) {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`;
    }

    // 生成随机用户名
    function generateRandomUsername(firstName, lastName) {
        const patterns = [
            // 名字.姓氏+随机数字
            () => `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
            // 姓氏+名字首字母+随机数字
            () => `${lastName.toLowerCase()}${firstName[0].toLowerCase()}${Math.floor(Math.random() * 100)}`,
            // 名字首字母+姓氏+年份
            () => `${firstName[0].toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 10) + 90}`,
            // 名字+随机数字
            () => `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
            // 姓氏+随机字母+随机数字
            () => `${lastName.toLowerCase()}${String.fromCharCode(97 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`
        ];

        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const result = pattern();
        return result.length > 16 ? result.substring(0, 16) : result;
    }

    // 添加发送Telegram通知的函数
    async function sendTelegramNotification(message) {
        const token = '您的Telegram Bot Token'; // 替换为您的Telegram Bot Token
        const chatId = '您的聊天ID'; // 替换为您的聊天ID
        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                }),
            });
            console.log('Telegram通知已发送:', message);
        } catch (error) {
            console.error('发送Telegram通知时出错:', error);
        }
    }

    // 生成随机邮箱
    async function recognizeCaptchaWithDdddocr(imgUrl) {
        try {
            // 获取图片数据
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();

            // 将图片数据转换为 Base64
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            // 调用后端 API 进行识别
            const result = await fetch('http://localhost:5001/recognize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64
                })
            });

            const text = await result.text(); // 先获取文本内容
            const data = JSON.parse(text); // 然后再解析为 JSON

            if (data.code === 0 && data.result) {
                console.log('验证码识别结果:', data.result);
                return data.result;
            } else {
                console.log('验证码识别结果:', data.result);
                return null;
            }
            return null;
        } catch (error) {
            console.error('验证码识别失败:', error);
            return null;
        }
    }

    // 修改验证码识别函数
    async function recognizeCaptcha(imgUrl) {
        return await recognizeCaptchaWithDdddocr(imgUrl);
    }

    // 修改验证码错误检测和重试逻辑
    async function handleCaptchaSubmission(maxAttempts = 1) {
        let attemptCount = 0;

        while (attemptCount < maxAttempts) {
            try {
                // 检查信息
                const maintenanceMsg = document.querySelector('.error_message.label-danger');
                if (maintenanceMsg && maintenanceMsg.textContent.includes('Maintenance time')) {
                    console.log('检测到维护状态，关闭页面');
                    window.location.reload();
                    return;
                }

                console.log(`开始第 ${attemptCount + 1} 次尝试...`);
                await autoFillForm();

                // 等待页面响应，检查验证码是否刷新
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 检查是否出现验证码错误消息
                const errorMessage = document.querySelector('.error_message.label-danger');
                if (errorMessage && errorMessage.textContent.includes('Invalid CAPTCHA')) {
                    console.log('验证码错误，等待自动刷新后继续...');
                    // 等待验证码自动刷新
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // 无论结果如何，继续下一次尝试
                attemptCount++;

            } catch (error) {
                console.error('处理验证码提交出错:', error);
                attemptCount++;
            }
        }

        console.log(`完成所有 ${maxAttempts} 次尝试`);
    }

    // 修改原有的自动填充函数
    async function autoFillForm() {
        const name = generateRandomName();
        const email = getRandomEmail();
        let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 13) + 'xjj';

        // 指定邮箱对应指定用户名的配置
        const customEmailToUsernameMap = {
            'xxx@cock.lu': 'xxx888'
        };
        if (customEmailToUsernameMap.hasOwnProperty(email)) {
            username = customEmailToUsernameMap[email];
        }

        // 在开始填充前打印信息
        console.log('------------------------');
        console.log('准备提交的账号信息：');
        console.log('姓名:', `${name.firstName} ${name.lastName}`);
        console.log('用户名:', username);
        console.log('邮箱:', email);
        console.log('------------------------');

        // 填充名字字段
        const firstNameInputs = document.querySelectorAll('input[name*="first_name" i], input[id*="first_name" i]');
        firstNameInputs.forEach(input => input.value = name.firstName);

        // 填充姓氏字段
        const lastNameInputs = document.querySelectorAll('input[name*="last_name" i], input[id*="last_name" i]');
        lastNameInputs.forEach(input => input.value = name.lastName);

        // 填充用户名字段
        const usernameInputs = document.querySelectorAll('input[name*="username" i], input[id*="username" i]');
        usernameInputs.forEach(input => input.value = username);

        // 填充邮箱字段
        const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i]');
        emailInputs.forEach(input => input.value = email);

        // 填充答案字段
        const answerInputs = document.querySelectorAll('input[name*="question" i], input[id*="question" i]');
        answerInputs.forEach(input => input.value = "0");

        // 自动勾选服务条款复选框
        const tosCheckboxes = document.querySelectorAll('input[type="checkbox"][name="tos"], input[type="checkbox"][id*="tos" i]');
        tosCheckboxes.forEach(checkbox => checkbox.checked = true);

        // 填充验证码字段
        try {
            const captchaImg = document.querySelector('img.captcha.is-');
            const input = document.getElementById('id_captcha_1');

            if (captchaImg && captchaImg.src) {
                console.log('找到验证码图片:', captchaImg.src);

                // 等待图片完全加载
                if (!captchaImg.complete) {
                    await new Promise(resolve => {
                        captchaImg.onload = resolve;
                        captchaImg.onerror = resolve;
                    });
                }

                const captchaCode = await recognizeCaptcha(captchaImg.src);
                if (captchaCode) {
                    input.value = captchaCode.toUpperCase();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('成功填验证码:', captchaCode.toUpperCase());

                    // 自动填充完成后提交表单
                    const submitButton = document.querySelector('button.is-primary');
                    if (submitButton) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        submitButton.click();
                    }
                }
            }
        } catch (error) {
            console.error('处理验证码时出错:', error);
            throw error;
        }

        // 等待并自动勾选 Cloudflare 验证复选框
        try {

            // 定期检查
            const checkInterval = setInterval(checkAndHandleFlex, 1000);

            // 创建 MutationObserver 实例
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    // 检查样式变化
                    if (mutation.type === 'attributes' &&
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        const el = mutation.target;
                        const style = window.getComputedStyle(el);
                        if (style.display === 'flex') {
                            console.log('Flex 元素样式变化:', {
                                element: el.tagName,
                                id: el.id,
                                class: el.className,
                                style: el.style.cssText
                            });
                            checkAndHandleFlex();
                        }
                    }

                    // 检查新增节点
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // 元素节点
                                const style = window.getComputedStyle(node);
                                if (style.display === 'flex') {
                                    console.log('新增 Flex 节点:', {
                                        tag: node.tagName,
                                        id: node.id,
                                        class: node.className
                                    });
                                    checkAndHandleFlex();
                                }
                            }
                        });
                    }
                });
            });

            // 配置观察选项
            const config = {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: ['style', 'class']
            };

            // 开始观察整个文档
            observer.observe(document.documentElement, config);

            // 60秒后停止观察
            setTimeout(() => {
                clearInterval(checkInterval);
                observer.disconnect();
                console.log('停止监听 Cloudflare 验证');
            }, 60000);

        } catch (error) {
            console.error('监听 Cloudflare 验证时出错:', error);
        }

        return { username, email }; // 返回用户名和邮箱
    }

    // 直接在页面加载完成后执行
    window.onload = async function() {
        console.log('检测到维护状态，关闭页面');
        try {
            // 检查维护信息
            const maintenanceMsg = document.querySelector('.error_message.label-danger');
            if (maintenanceMsg && maintenanceMsg.textContent.includes('Maintenance time')) {
                console.log('检测到维护状态，关闭页面');
                window.close();
                return;
            }

            console.log('开始自动填充表单...');
            let lastSubmittedInfo = await autoFillForm(); // 保存用户信息

            // 检查成功消息的可见性
            const successMessage = document.querySelector('.notification.is-success');
            const isVisible = successMessage && getComputedStyle(successMessage).display !== 'none'; // 检查成功消息是否可见
            console.log('111成功消息可见性:', isVisible); // 打印 isVisible 的值

            if (isVisible) {
                console.log('111Serv00账户已成功创建');
                const message = `dabo手搓Serv00账户已成功创建！\n用户名: ${lastSubmittedInfo.username}\n邮箱: ${lastSubmittedInfo.email}`;
                await sendTelegramNotification(message);
            }

            let retryCount = 0;
            const MAX_RETRIES = 5; // 最多重试2次

            // 添加验证码错误和维护时间监听
            const observer = new MutationObserver(async (mutations) => {
                for (const mutation of mutations) {
                    const errorMessage = document.querySelector('.error_message.label-danger');
                    if (errorMessage) {
                        if (errorMessage.textContent.includes('Maintenance time')) {
                            console.log('检测到维护状态，关闭页面');
                            observer.disconnect();
                            window.location.reload();
                            return;
                        }
                        if (errorMessage.textContent.includes('Invalid CAPTCHA')) {
                            if (retryCount < MAX_RETRIES) {
                                retryCount++;
                                console.log(`验证码错误，第${retryCount}次重试...`);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                lastSubmittedInfo = await autoFillForm(); // 重新填充表单并保存用户信息
                            } else {
                                console.log('已达到最大重试次数，停止重试');
                                observer.disconnect();
                            }
                        }
                    }

                    const successMessage = document.querySelector('.notification.is-success');
                    const isVisible = successMessage && getComputedStyle(successMessage).display !== 'none'; // 检查成功消息是否可见
                    console.log('333成功消息可见性:', isVisible); // 打印 isVisible 的值

                    if (isVisible) {
                        console.log('333Serv00账户已成功创建');
                        const message = `友情提醒Serv00账户已成功创建！\n用户名: ${lastSubmittedInfo.username}\n邮箱: ${lastSubmittedInfo.email}`;
                        await sendTelegramNotification(message);
                    }
                }
            });

            // 开始观察页面变化
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

             // 使用 setTimeout 定期检查成功消息
            const checkSuccessMessage = async () => {
                // 检查信息
                const maintenanceMsg = document.querySelector('.error_message.label-danger');
                if (maintenanceMsg && maintenanceMsg.textContent.includes('Maintenance time')) {
                    console.log('检测到维护状态，关闭页面');
                    //window.location.reload();
                    return;
                }

                const emailError = document.querySelector('.error_message.pull-right.label.label-danger');
                const isRegVisible = emailError && emailError.textContent.includes('An account has already been registered to this e-mail address.');
                console.log('定期已注册成功消息可见性:', isRegVisible); // 打印定期检查的可见性
                if (isRegVisible) {
                    console.log('检测到邮箱已注册成功，停止重试');
                    const atIndex = lastSubmittedInfo.email.indexOf('@');
                    const emailMasked = `${lastSubmittedInfo.email.substring(0, atIndex - 2)}**${lastSubmittedInfo.email.substring(atIndex)}`;
                    const message = `邮箱提示已注册成功！\n用户名: ${lastSubmittedInfo.username}\n邮箱: ${emailMasked}`;
                    await sendTelegramNotification(message);
                    observer.disconnect();
                    return;
                }

                const successMessage = document.querySelector('.notification.is-success');
                const isVisible = successMessage && getComputedStyle(successMessage).display !== 'none';
                console.log('定期检查成功消息可见性:', isVisible); // 打印定期检查的可见性

                if (isVisible) {
                    const atIndex = lastSubmittedInfo.email.indexOf('@');
                    const emailMasked = `${lastSubmittedInfo.email.substring(0, atIndex - 2)}**${lastSubmittedInfo.email.substring(atIndex)}`;
                    const message = `🎉🎉🎉Serv00账户已成功创建！\n用户名: ${lastSubmittedInfo.username}\n邮箱: ${emailMasked}`;
                    await sendTelegramNotification(message);
                    console.log('定期检查Serv00账户已成功创建'); // 只在成功时打印一次
                    observer.disconnect(); // 停止观察
                } else {
                    setTimeout(checkSuccessMessage, 60000); // 每5秒检查一次
                }
            };

            // 开始定期检查
            setTimeout(checkSuccessMessage, 60000); // 初始检查延迟5秒

        } catch (error) {
            console.error('表单填充出错:', error);
        }
    };

})(); // 注意保留最后的闭包结束
