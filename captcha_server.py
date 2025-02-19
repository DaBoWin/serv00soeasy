from flask import Flask, request, jsonify
import ddddocr
import base64
from flask_cors import CORS
from PIL import Image
import PIL

# 直接修改 PIL 的属性
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化 ddddocr
ocr = ddddocr.DdddOcr()

@app.route('/recognize', methods=['POST'])
def recognize_captcha():
    try:
        # 获取图片数据
        data = request.json
        
        image_base64 = data.get('image')
        print(f"接收到的image_base64: {image_base64}")
        if not image_base64:
            print(f"未提供图片数据")
            return jsonify({'code': 1, 'message': '未提供图片数据'})
        
        # Base64 解码
        try:
            image_bytes = base64.b64decode(image_base64)
            print(f"成功解码base64图片数据")
        except Exception as e:
            print(f"base64解码失败: {str(e)}")
            return jsonify({'code': 1, 'message': 'base64解码失败'})
            
        # 识别验证码
        try:
            result = ocr.classification(image_bytes)
            if not result:
                print("验证码识别失败,返回结果为空")
                return jsonify({'code': 1, 'message': '验证码识别失败'})
                
            print(f"识别结果: {result}")
            return jsonify({
                'code': 0,
                'result': result
            })
        except Exception as e:
            print(f"验证码识别出错: {str(e)}")
            return jsonify({'code': 1, 'message': f'验证码识别失败: {str(e)}'})
    except Exception as e:
        return jsonify({
            'code': 1,
            'message': str(e)
        })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
