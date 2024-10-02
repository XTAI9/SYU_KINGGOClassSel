// 完整的 AIScheduleTools 代码
function AIScheduleTools() {
    // 获取基础 DOM，优先从 body 中获取，如果是 frameset 则获取 html
    const getBaseDom = () => {
        if (document.body.tagName === 'FRAMESET') return document.getElementsByTagName('html')[0];
        return document.body;
    };

    const baseDom = getBaseDom();

    // 添加 meta 标签，确保 viewport 设置正确，避免移动设备的缩放问题
    const addMeta = () => {
        const head = document.getElementsByTagName('head')[0];
        if (head.childNodes.length === 1 || (window?.devicePixelRatio && window.devicePixelRatio !== 1)) {
            const meta = document.createElement('meta');
            meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
            meta.setAttribute("name", "viewport");
            head.appendChild(meta);
        }
    };

    // 创建基础 DOM 元素，便于复用
    const createDom = () => document.createElement('ai-schedule-div');

    // 创建标题元素
    const createTitle = (text = '提示') => {
        const title = createDom();
        title.innerText = text;
        title.style.cssText = `display: block; color: #000; font-size: 20px;`;
        return title;
    };

    // 创建内容元素
    const createContent = text => {
        const content = createDom();
        content.innerText = text;
        content.style.cssText = `display: block; color: #989898;`;
        return content;
    };

    // 创建按钮元素，支持主按钮样式
    const createBtn = (text = '确认', type = 'primary') => {
        const btn = createDom();
        btn.innerText = text;
        btn.style.cssText = `display:block; width: 45%; text-align: center;`;
        if (type === 'primary') {
            btn.style.cssText += `background-color: #0d84FF; color: #fff;`;
        }
        return btn;
    };

    // 创建遮罩层，便于显示提示信息
    const createMask = child => {
        const mask = createDom();
        mask.style.cssText = `position: fixed; top: 0; left: 0; height: 100vh; width: 100vw; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;`;
        child && mask.appendChild(child);
        return mask;
    };

    // 弹出提示框，配合遮罩层一起使用
    const AIScheduleAlert = param => new Promise(resolve => {
        let textConfig = { contentText: '提示信息', titleText: '提示', confirmText: '确认' };
        if (typeof param === 'string') {
            textConfig.contentText = param;
        } else {
            textConfig = { ...textConfig, ...param };
        }
        addMeta();
        const title = createTitle(textConfig.titleText);
        const content = createContent(textConfig.contentText);
        const btn = createBtn(textConfig.confirmText);
        const card = createDom();
        card.appendChild(title);
        card.appendChild(content);
        card.appendChild(btn);
        const mask = createMask(card);
        baseDom.appendChild(mask);
        btn.onclick = () => {
            baseDom.removeChild(mask);
            resolve();
        };
    });

    // 显示加载中的遮罩和动画
    const AIScheduleLoading = (text = '处理中...') => {
        const title = createTitle(text);
        const loading = createDom();
        loading.innerHTML = '<div class="loader"></div>'; // Loader 样式可自定义
        const card = createDom();
        card.appendChild(title);
        card.appendChild(loading);
        const mask = createMask(card);
        baseDom.appendChild(mask);
        return mask; // 返回 mask 以便后续移除
    };

    window.AIScheduleAlert = AIScheduleAlert;
    window.AIScheduleLoading = AIScheduleLoading;
}

// 青果课程图片识别函数
async function KingoImgReader(image) {
    if (!image) return JSON.stringify({ error: "无效的图像标签" });

    // 获取图像并转换为 Blob 格式
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    const base64Img = canvas.toDataURL("image/png");

    // 将 DataURL 转换为 Blob
    const dataURLtoBlob = dataurl => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
        return new Blob([u8arr], { type: mime });
    };

    // 将 Blob 转换为 File
    const blob = dataURLtoBlob(base64Img);
    const file = new File([blob], 'kingo.png');
    const param = new FormData();
    param.append('kingoImg', file);

    try {
        console.log("准备发送 OCR 请求...");
        // 调用 OCR API
        const res = await fetch('https://open-schedule-prod.ai.xiaomi.com/kingo-ocr', {
            method: 'POST',
            body: param,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
        });

        // 检查响应状态
        if (!res.ok) {
            console.error(`OCR 请求失败，状态码: ${res.status}`);
            return JSON.stringify({ error: `OCR 请求失败，状态码: ${res.status}` });
        }

        // 处理 API 返回的结果
        const json = await res.json();
        console.log("OCR API 返回结果: ", json);

        // 将 API 返回的结果映射为课程数据
        const parsedCourses = json.map(course => {
            return {
                name: course.name || '未知课程',
                teacher: course.teacher || '未知教师',
                weeks: course.weeks && course.weeks.length ? course.weeks : "1-16",  // 默认1-16周
                sections: course.sections && course.sections.length ? course.sections : [1, 2],  // 默认第1-2节
                day: course.day || 1,  // 默认星期一
                position: course.position || '未知教室'
            };
        });

        return JSON.stringify(parsedCourses);

    } catch (error) {
        // 捕获并记录 OCR 请求的错误
        console.error("OCR 请求失败: ", error);
        return JSON.stringify({ error: "OCR 请求失败" });
    }
}

window.KingoImgReader = KingoImgReader;

// provider 函数，用于获取课程表的图片并提交给 OCR 识别
async function scheduleHtmlProvider() {
    // 加载工具
    await loadTool('AIScheduleTools');
    await loadTool('KingoImgReader');

    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 定位到 iframe，尝试获取课程表图片
    const frmRpt = document.querySelector('iframe[name="frmRpt"]');
    if (!frmRpt) {
        await AIScheduleAlert('未找到课程表 iframe，请重试');
        return 'do not continue';
    }

    const frmRptDoc = frmRpt.contentWindow?.document;
    if (!frmRptDoc) {
        await AIScheduleAlert('无法访问课程表内容，请重试');
        return 'do not continue';
    }

    // 查找课程表图片
    const img = frmRptDoc.querySelector('img');
    if (!img) {
        await AIScheduleAlert('未找到课程表图片，请重试');
        return 'do not continue';
    }

    console.log("找到的课程表图片: ", img.src);

    // 显示加载中提示
    const loadingMask = AIScheduleLoading('正在解析课程表，请稍候...');

    // 直接调用 KingoImgReader 提交 OCR 请求
    const providerRes = await KingoImgReader(img);

    // 隐藏加载提示
    if (loadingMask && loadingMask.parentNode) {
        loadingMask.parentNode.removeChild(loadingMask);
    }

    console.log("OCR 结果: ", providerRes);
    return providerRes; // 返回 OCR 结果
}

window.scheduleHtmlProvider = scheduleHtmlProvider; // 导出函数
