//v1.1
(function(ua, win) {
	var j2s = JSON.stringify;
	var imp = win.imp || {};
	imp.callbacks = {};
	imp.currentVersion = "5.6.0"
	imp.IAS = "com.inspur.gsp.imp.framework.plugin.GloSessionService"; //imp android service
	imp.invoke = function(cls, md, pa) {
		var params = {
			className: cls,
			methodName: md,
			param: pa
		};
		if (!md) {
			params = cls; //兼容老版
		}
		var iframe = document.createElement("iframe"),
			iframeUrl = "imp://" + encodeURIComponent(j2s(params));
		iframe.setAttribute("src", iframeUrl);
		document.body.appendChild(iframe);
		iframe.parentNode.removeChild(iframe);
		iframe = null;
	};

	imp.ivk = function(cls, md, p) {
		imp.invoke(cls, md, imp.os.android ? j2s(p) : p);
	};

	imp.plugin = function(plugin, name, op, success, fail) {
		var sf = plugin + "_" + name + "Success";
		var ff = plugin + "_" + name + "Fail";

		imp.callbacks[sf] = success || empFunc;
		imp.callbacks[ff] = fail || empFunc;

		var param = {
			success: "imp.callbacks." + sf,
			fail: "imp.callbacks." + ff,
			options: op
		};
		imp.ivk(plugin, name, param);
	};

	var os = imp.os = {};
	os.ipad = !!ua.match(/(iPad).*OS\s([\d_]+)/);
	os.iphone = !os.ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
	os.ios = os.ipad || os.iphone;
	os.isInYJ = !!ua.match(/(emmcloud)/i);
	os.android = ua.indexOf('Android') > -1;
	var trueP = function(p) {
		return imp.os.android ? j2s(p) : p;
	};

	var toAbsURL = function(url) {
		url = url.replace(/\s*/g, "")
		if (/^http(s)?:\/\//.test(url)) {
			return url;
		}
		var a = document.createElement('a');
		a.href = url;
		return a.href;
	};

	var isFunc = function(obj) {
		return typeof obj === "function";
	};

	var isObj = function(obj) {
		return typeof obj === "object";
	};

	var empFunc = function() {};

	/**
	 * 窗口相关。
	 */
	imp.iWindow = (function() {
		var win = {};
		var callback = [];
		win.close = function() {
			if (!!imp.os.android) {
				imp.invokeAndReturn(imp.IAS, "getClose", '{}');
			} else {
				imp.invoke("WindowService", "close");
			}
		};
		win.closeWebPop = function() {

			imp.invoke("WindowService", "closeWebPop");

		};
		win.open = function(ops) {
			if (!ops) {
				return alert("options can't be null.");
			}
			if(ops.url){
				ops.url = toAbsURL(ops.url);
			}

			imp.ivk("WindowService", "open", ops);
		};

		win.openNativeSettings = function() {

			imp.ivk("WindowService", "openSettings");
		};

		win.onTitleSelectCallback = function(i) {
			if (callback && callback[i]) {
				callback[i]();
			}
		};

		win.setTitles = function(options) {
			var ops = [];
			if (options && options.length) {
				for (var i = 0; i < options.length; i++) {
					var op = {
						ico: options[i].ico,
						text: options[i].text,
						action: "imp.iWindow.onTitleSelectCallback(" + i + ")",
						selected: !!options[i].selected
					};
					ops.push(op);
					callback.push(options[i].action);
				}

				var param = {
					config: ops
				};

				imp.invoke("WindowService", "setTitles", trueP(param));
			}
		};

		win.sysInfo = function(success, fail) {
			imp.plugin("DeviceService", "getInfo", null, success, fail);
		};

		win.showLoading = function(d) {
			if (imp.os.ios) {
				var params = {
					className: "DialogService",
					methodName: "show",
					content: d || ''
				};
				imp.invoke(params);
			} else {
				window.imp.invoke("LoadingDialogService", "show", j2s({
					content: d || ''
				}));
			}

		};
		win.hideLoading = function() {
			imp.invoke(imp.os.ios ? "DialogService" : "LoadingDialogService", "hide");
		};

		win.setMenus = function(menus) {
			if (!menus || !menus.length) {
				return false;
			}
			for (var i = 0; i < menus.length; i++) {
				imp.callbacks["windowsMenu" + i] = menus[i].callback;
				menus[i].callback = "imp.callbacks.windowsMenu" + i + "()";
			}
			var data = {
				"menus": menus
			};
			imp.invoke("WindowService", "setMenus", trueP(data));
		};

		win.onBackKeyDown = function(fn) {
			if (typeof fn !== "function") {
				return;
			}
			win.onBackKeyDown = fn || function() {};
			imp.invoke("WindowService", "onBackKeyDown", '{"callback":"imp.iWindow.onBackKeyDown"}');
		};

		win.onCancelBackKeyDown = function(){
			win.onBackKeyDown = function(fn) {
				if (typeof fn !== "function") {
					return;
				}
				win.onBackKeyDown = fn || function() {};
				imp.invoke("WindowService", "onBackKeyDown", '{"callback":"imp.iWindow.onBackKeyDown"}');
			};
			imp.invoke("WindowService", "onCancelBackKeyDown");
		};


		/**
		 * 开启防截屏
		 */
		win.enableScreenshot = function() {
			if (imp.os.android) {
				imp.invoke("ScreenshotService", "enableScreenshot");
			}
		};
		/**
		 * 关闭防截屏
		 */
		win.disableScreenshot = function() {
			if (imp.os.android) {
				imp.invoke("ScreenshotService", "disableScreenshot");
			}
		};

		// 隐藏、展示web导航栏
		win.displayTitleBar = function(option, success) {
			imp.plugin("WindowService", "setTitleBar", option, success, null);
		};

		// 获取当前window的授权信息
		win.getAuthorization = function(option, success) {
			imp.plugin("WindowService", "getAuthorization", option, success, null);
		};

		// 通过频道名获取机器人频道未读数量
		win.getRobotChannelUnreadNum = function(option, success) {
			imp.plugin("WindowService", "getRobotChannelUnreadNum", option, success, null);
		};

		// 通过频道名称跳转到机器人频道
		win.pushRobotChannel = function(option, success) {
			imp.plugin("WindowService", "pushRobotChannel", option, success, null);
		};

		// 获取当前window页面错误信息
		win.getWebPageErrorEvent = function(option, success) {
			imp.plugin("WindowService", "getWebPageErrorEvent", option, success, null);
		};

		//添加App国际化语言变更监听
		win.getAppLanguage = function(option, success) {
			imp.plugin("WindowService", "getAppLanguage", option, success, null);
		};
		return win;
	})();

	/**
	 * 数据库相关。
	 */
	imp.iDb = (function(db) {
		db.execute = function(options, success, fail) {
			imp.plugin("SqlService", "executeSql", options, success, fail);
		};

		db.close = function(options, success, fail) {
			imp.plugin("SqlService", "close", options, success, fail);
		};

		db.executeTransction = function(options, success, fail) {
			imp.plugin("SqlService", "executeTransaction", options, success, fail);
		};

		db.delete = function(options, success, fail) {
			imp.plugin("SqlService", "delete", options, success, fail);
		};

		//默认数据库中存取值（key value）
		db.putItem = function(options, success) {
			imp.plugin("SqlService", "putItem", options, success, null);
		};
		//获取值根据key
		db.getItem = function(options, success) {
			imp.plugin("SqlService", "getItem", options, success, null);
		};
		//获取值根据key
		db.getItemNew = function(options, success) {
			imp.plugin("SqlService", "getItemNew", options, success, null);
		};
		//删除值根据key
		db.deleteItem = function(options, success) {
			imp.plugin("SqlService", "deleteItem", options, success, null);
		};
		//获取全部
		db.getAllItems = function(options, success) {
			imp.plugin("SqlService", "getAllItems", options, success, null);
		};
		//删除全部
		db.delAllItems = function(options, success) {
			imp.plugin("SqlService", "delAllItems", options, success, null);
		};
		return db;
	})(imp.iDb || {});

	/**
	 * 系统相关。
	 */
	imp.iDevice = (function(device) {
		device.checkNetwork = function(success) {
			if (!isFunc(success)) {
				return;
			}

			imp.plugin("NetworkService", "getNetWorkType", null, success);
		};

		device.sysInfo = function(success, fail) {
			imp.plugin("DeviceService", "getInfo", null, success, fail);
		};


		//打开闪光灯
		device.openFlashlamp = function(success, fail) {
			imp.plugin("DeviceService", "openFlashlamp", null, success, fail);
		};

		//关闭闪光灯
		device.closeFlashlamp = function(success, fail) {
			imp.plugin("DeviceService", "closeFlashlamp", null, success, fail);
		};

		//清除web应用缓存
		device.clearWebCache = function(success, fail) {
			imp.plugin("DeviceService", "clearWebCache", null, success, fail);
		};

		//打开震动
		device.startVibrate = function(option, success, fail) {
			imp.plugin("DeviceService", "startVibrate", option, success, fail);
		};

		//关闭震动
		device.closeVibrate = function(success, fail) {
			imp.plugin("DeviceService", "closeVibrate", null, success, fail);
		};

		//打开Web旋转
		device.enableWebRotate = function(success, fail) {
			imp.plugin("DeviceService", "enableWebRotate", null, success, fail);
		};

		//关闭Web旋转
		device.disableWebRotate = function(success, fail) {
			imp.plugin("DeviceService", "disableWebRotate", null, success, fail);
		};

		// //打开原生旋转
		// device.openNativeRevolve = function(success, fail) {
		// 	imp.plugin("DeviceService", "openNativeRevolve", null, success, fail);
		// };

		// //关闭原生旋转
		// device.closeNativeRevolve = function(success, fail) {
		// 	imp.plugin("DeviceService", "closeNativeRevolve", null, success, fail);
		// };

		return device;
	})(imp.iDevice || {});

	/**
	 * GPS
	 */
	imp.iGps = (function(iGps) {

		var ias = "com.inspur.imp.plugin.gps.GpsService";
		/**
		 * 打开GPS
		 */
		iGps.open = function() {
			if (imp.os.ios) {
				imp.invoke("GpsService", "open", null);
			} else if (imp.os.android) {
				imp.invoke(ias, "open");
			}
		};

		/**
		 * 关闭GPS
		 */
		iGps.close = function() {
			if (imp.os.ios) {
				imp.invoke("GpsService", "close", null);
			} else if (imp.os.android) {
				imp.invoke(ias, "close");
			}
		};

		/**
		 * 获取位置服务状态// Android接口
		 */
		iGps.isSupportLocationService = function(suc) {
			imp.plugin("GpsService", "supportLocationService", null, suc);

		};

		/**
		 * 获取GPS定位信息回调
		 *
		 * @param info
		 *            定位信息，json串，key分别为：latitude,longitude,satelliteNum
		 */
		iGps.getInfoCallback = function(info) {
			if (typeof info != "object") {
				info = eval("(" + info + ")");
			}
			//回调
			iGps.successCallback && iGps.successCallback(info);
		};

		/**
		 * 获取GPS定位信息
		 *
		 * @param 获得GPS定位信息回调函数，如果不传，默认是iGps.getInfoCallback
		 */
		iGps.getInfo = function(callback, options) {
			iGps.successCallback = callback;

			// 封装参数
			var param = {
				callback: "imp.iGps.getInfoCallback"
			};

			if (options && options.coordinateType == "WGS84") {
				param.coordinateType = options.coordinateType;
				if (imp.os.ios) {
					imp.invoke("GpsService", "getInfo", param);
				} else if (imp.os.android) {
					window.imp.invoke("com.inspur.imp.plugin.amaplocation.AmapLocateService",
						"getInfo", j2s(param));
				}
				return;
			}

			if (imp.os.ios) {
				param.type = "gd";
			}
			imp.ivk("GpsService", "getInfo", param);
		};

		/**
		 * 通过经纬度坐标获取街道等具体地址信息。
		 *
		 * @options 坐标信息
		 *
		 * @callback 回调函数
		 */
		iGps.getAddress = function(options, suc, err) {
			options.coordType = options.coordType || 'GCJ02';
			if (options.coordType != 'GCJ02' && options.coordType != 'WGS84') {
				return alert('coordType error!');
			}

			if (!isFunc(suc)) {
				return;
			}
			imp.plugin("GpsService", "getAddress", options, suc, err);

		};


		/**
		 * 调用导航软件。
		 *
		 * @options 坐标信息,GCJ02 高德(火星坐标)，WGS84 国际、百度
		 *
		 * @callback 回调函数
		 */
		iGps.navigation = function(options, callback) {
			if (!isObj(options)) {
				return alert('error options!');
			}

			options.coordType = options.coordType || 'GCJ02';
			if (options.coordType != 'GCJ02' && options.coordType != 'WGS84') {
				return alert('coordType error!');
			}

			imp.plugin("MapService", "navigationByAutoNavi", options, null, callback);
		};

		/**
		 * 打开、关闭 轨迹上传
		 *
		 * @options 坐标信息,GCJ02 高德(火星坐标)，WGS84 国际、百度
		 *
		 * @callback 回调函数
		 */
		iGps.uploadTrace = function(options, success) {
			imp.plugin("GpsService", "uploadTrace", options, success, null);
		};

		return iGps;
	})(imp.iGps || {});

	/**
	 * 二维码/条码扫描
	 */
	imp.iBarCode = (function(iBarCode) {

		/**
		 * 扫描二维码
		 *
		 * @param callback
		 *            扫描结束回调函数，如果不传，默认为iBarcode.scanCallback
		 */
		iBarCode.scan = function(callback) {
			iBarCode.successCallback = callback;

			// 封装参数
			var param = {
				callback: "imp.iBarCode.scanSuccessCallback"
			};

			if (imp.os.ios) {
				imp.invoke("BarCodeService", "scan", param);
			} else if (imp.os.android) {
				imp.invoke("com.inspur.imp.plugin.barcode.scan.BarCodeService", "scan", j2s(param));
			}
		};

		/**
		 * 扫描二维码回调
		 *
		 * @param scanCode
		 *            扫描结果
		 */
		iBarCode.scanSuccessCallback = function(scanCode) {
			//回调
			iBarCode.successCallback && iBarCode.successCallback(scanCode);
		};
		window.iBarCode = iBarCode;
		return iBarCode;
	})(imp.iBarCode || {});
	//-------------------------------------------
	/**
	 * 水印
	 */
	imp.iWatermark = (function(iWatermark) {

		/**
		 * 加水印
		 */

		//=============================
		iWatermark.watermark = function(settings) {
			//默认设置
			var defaultSettings = {
				watermark_txt: "text",
				watermark_x: 10, //水印起始位置x轴坐标
				watermark_y: 10, //水印起始位置Y轴坐标
				watermark_rows: 20, //水印行数
				watermark_cols: 20, //水印列数
				watermark_x_space: 20, //水印x轴间隔
				watermark_y_space: 50, //水印y轴间隔
				watermark_color: '#aaa', //水印字体颜色
				watermark_alpha: 0.4, //水印透明度
				watermark_fontsize: '15px', //水印字体大小
				watermark_font: '微软雅黑', //水印字体
				watermark_width: 210, //水印宽度
				watermark_height: 80, //水印长度
				watermark_angle: 20 //水印倾斜度数
			};
			if (arguments.length === 1 && typeof arguments[0] === "object") {
				var src = arguments[0] || {};
				for (key in src) {
					if (src[key] && defaultSettings[key] && src[key] === defaultSettings[key]) continue;
					else if (src[key]) defaultSettings[key] = src[key];
				}
			}
			var oTemp = document.createDocumentFragment();
			//获取页面最大宽度
			var page_width = Math.max(document.body.scrollWidth, document.body.clientWidth);
			var cutWidth = page_width * 0.0150;
			var page_width = page_width - cutWidth;
			//获取页面最大高度
			var page_height = Math.max(document.body.scrollHeight, document.body.clientHeight) + 450;
			page_height = Math.max(page_height, window.innerHeight - 30);
			//如果将水印列数设置为0，或水印列数设置过大，超过页面最大宽度，则重新计算水印列数和水印x轴间隔
			if (defaultSettings.watermark_cols == 0 || (parseInt(defaultSettings.watermark_x +
					defaultSettings.watermark_width * defaultSettings.watermark_cols +
					defaultSettings.watermark_x_space * (defaultSettings.watermark_cols - 1)) >
				page_width)) {
				defaultSettings.watermark_cols = parseInt((page_width - defaultSettings.watermark_x +
					defaultSettings.watermark_x_space) / (defaultSettings.watermark_width +
					defaultSettings.watermark_x_space));
				defaultSettings.watermark_x_space = parseInt((page_width - defaultSettings.watermark_x -
					defaultSettings.watermark_width * defaultSettings.watermark_cols) / (
					defaultSettings.watermark_cols - 1));
			}
			//如果将水印行数设置为0，或水印行数设置过大，超过页面最大长度，则重新计算水印行数和水印y轴间隔
			if (defaultSettings.watermark_rows == 0 || (parseInt(defaultSettings.watermark_y +
					defaultSettings.watermark_height * defaultSettings.watermark_rows +
					defaultSettings.watermark_y_space * (defaultSettings.watermark_rows - 1)) >
				page_height)) {
				defaultSettings.watermark_rows = parseInt((defaultSettings.watermark_y_space +
					page_height - defaultSettings.watermark_y) / (defaultSettings
					.watermark_height + defaultSettings.watermark_y_space));
				defaultSettings.watermark_y_space = parseInt(((page_height - defaultSettings
					.watermark_y) - defaultSettings.watermark_height * defaultSettings
					.watermark_rows) / (defaultSettings.watermark_rows - 1));
			}
			var x;
			var y;
			for (var i = 0; i < defaultSettings.watermark_rows; i++) {
				y = defaultSettings.watermark_y + (defaultSettings.watermark_y_space + defaultSettings
					.watermark_height) * i;
				for (var j = 0; j < defaultSettings.watermark_cols; j++) {
					x = defaultSettings.watermark_x + (defaultSettings.watermark_width + defaultSettings
						.watermark_x_space) * j;
					var mask_div = document.createElement('div');
					mask_div.id = 'mask_div' + i + j;
					mask_div.className = 'mask_div';
					mask_div.appendChild(document.createTextNode(defaultSettings.watermark_txt));
					//设置水印div倾斜显示
					mask_div.style.webkitTransform = "rotate(-" + defaultSettings.watermark_angle +
						"deg)";
					mask_div.style.MozTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
					mask_div.style.msTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
					mask_div.style.OTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
					mask_div.style.transform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
					mask_div.style.visibility = "";
					mask_div.style.position = "absolute";
					mask_div.style.left = x + 'px';
					mask_div.style.top = y + 'px';
					mask_div.style.overflow = "hidden";
					mask_div.style.zIndex = "9999";
					//让水印不遮挡页面的点击事件
					mask_div.style.pointerEvents = 'none';
					mask_div.style.opacity = defaultSettings.watermark_alpha;
					mask_div.style.fontSize = defaultSettings.watermark_fontsize;
					mask_div.style.fontFamily = defaultSettings.watermark_font;
					mask_div.style.color = defaultSettings.watermark_color;
					mask_div.style.textAlign = "center";
					mask_div.style.width = defaultSettings.watermark_width + 'px';
					mask_div.style.height = defaultSettings.watermark_height + 'px';
					mask_div.style.display = "block";
					oTemp.appendChild(mask_div);
				};
			};
			document.body.appendChild(oTemp);
		};
		//=============================

		window.iWatermark = iWatermark;
		return iWatermark;
	})(imp.iWatermark || {});
	//-------------------------------------------

	/**
	 * 拍照
	 */
	imp.iCamera = (function(iCamera) {
		var ias = "com.inspur.imp.plugin.camera.CameraService";
		var setOptions = function(op) {
			op.destinationType = 0;
			op.targetWidth = op.targetWidth || 0;
			op.targetHeight = op.targetHeight || 0;
			return op;
		};
		iCamera.DestinationType = {
			DATA_URL: 0, //将选择的图片按base64-encoded编码方式返回
			FILE_URI: 1, //将选择的图片返回其在本地的地址,即本机url
			NATIVE_URI: 2 //将选择的图片返回其在项目的asset文件夹中的路径
		};

		iCamera.EncodingType = {
			JPEG: 0, //返回图片为jpeg格式
			PNG: 1 //返回图片为png的格式 
		};

		/**
		 *
		 * 成功回调
		 *
		 * @param info
		 *       输出信息
		 */
		iCamera.openSuccessCallback = function(info) {
			//回调
			if (typeof info != 'object') {
				info = eval("(" + info + ")");
			}

			iCamera.successCallback && iCamera.successCallback(info);
		};

		iCamera.openErrorCallback = function(info) {
			//回调
			iCamera.errorCallback && iCamera.errorCallback(info);
		};


		/**
		 * 打开相机照相
		 *
		 * @param options
		 *            拍照参数
		 *
		 * @param successCallback
		 *            拍照成功回调函数
		 *
		 * @param errorCallback
		 *            拍照失败回调函数
		 *
		 *
		 */
		iCamera.open = function(options, successCallback, errorCallback) {
			iCamera.successCallback = successCallback;
			iCamera.errorCallback = errorCallback;
			options = setOptions(options);
			// 封装参数
			var param = {
				success: "imp.iCamera.openSuccessCallback",
				fail: "imp.iCamera.openErrorCallback",
				options: options
			};
			if (imp.os.ios) {
				imp.invoke("CameraService", "open", param);
			} else if (imp.os.android) {
				imp.invoke(ias, "open", j2s(param));
			}
		};


		/**
		 * 从相册获取图片
		 *
		 * @param options
		 *            图片选择参数
		 * @param successCallback
		 *            图片选择成功回调函数
		 *
		 * @param errorCallback
		 *            图片选择失败回调函数
		 *
		 */
		iCamera.select = function(options, successCallback, errorCallback) {
			iCamera.chooseSuccessCallback = successCallback;
			iCamera.chooseErrorCallback = errorCallback;
			options = setOptions(options);
			// 封装参数
			var param = {
				success: "imp.iCamera.selectSuccessCallback",
				fail: "imp.iCamera.selectErrorCallback",
				options: options
			};
			if (imp.os.ios) {
				imp.invoke("CameraService", "getPicture", param);
			} else if (imp.os.android) {
				imp.invoke(ias, "getPicture", j2s(param));
			}
		};
		/**
		 *
		 * 成功回调
		 *
		 * @param info
		 *       输出信息
		 */
		iCamera.selectSuccessCallback = function(info) {

			//回调
			var data = info;
			if (typeof info != "object") {
				data = eval("(" + info + ")");
			}
			iCamera.chooseSuccessCallback && iCamera.chooseSuccessCallback(data);
		};

		iCamera.selectErrorCallback = function(info) {
			//回调
			iCamera.chooseErrorCallback && iCamera.chooseErrorCallback(info);
		};

		return iCamera;
	})(imp.iCamera || {});


	///影像
	imp.iPhoto = (function(iPhoto) {
		var adrSvr = "com.inspur.imp.plugin.photo.PhotoService";
		iPhoto.DestinationType = {
			DATA_URL: 0, //将选择的图片按base64-encoded编码方式返回
			FILE_URI: 1, //将选择的图片返回其在本地的地址,即本机url
			NATIVE_URI: 2 //将选择的图片返回其在项目的asset文件夹中的路径
		};

		iPhoto.EncodingType = {
			JPEG: 0, //返回图片为jpeg格式
			PNG: 1 //返回图片为png的格式 
		};
		var gsPath =
			'/cwbase/gsp/webservice/RESTFulWebService/RestFulServiceForIMP.ashx?resource=gspiot&method=PhotoHandler&type=';
		/**
		 * 打开相机照相
		 *
		 * @param options
		 *            拍照参数
		 *
		 * @param successCallback
		 *            拍照成功回调函数
		 *
		 * @param errorCallback
		 *            拍照失败回调函数
		 *
		 *
		 */
		iPhoto.takePhotoAndUpload = function(options, successCallback, errorCallback) {
			if (!imp.os.isInYJ) {
				alert('takePhotoAndUpload is only support in yun+');
				return;
			}
			if (typeof options != 'object') {
				alert('options must be a object!');
				return;
			}

			var op = options;
			op.quality = op.quality || 90;
			op.encodingType = op.encodingType || 0;

			var defaultRectScaleList;
			imp.iWindow.getAppLanguage({}, function(info) {//国际化
				let jsState = Number(info.state);
				let appAppLanguage = "zh-Hans";

				if (jsState == 1) {
					//获取当前的语言系统
					appAppLanguage = info.result.data.language;
				} else {
					//获取失败 默认值使用简体中文
					appAppLanguage = "zh-Hans";
				}

				if (appAppLanguage === "en") {//英文
					defaultRectScaleList = [{
						"name": "A4 paper",
						"rectScale": "210:297"
					}, {
						"name": "value added tax",
						"rectScale": "233:150"
					}, {
						"name": "Train tickets",
						"rectScale": "86:54"
					}, {
						"name": "custom",
						"rectScale": "custom"
					}];
				} else if (appAppLanguage === "zh-Hant") {//繁体中文
					defaultRectScaleList = [{
						"name": "A4紙",
						"rectScale": "210:297"
					}, {
						"name": "增值稅",
						"rectScale": "233:150"
					}, {
						"name": "火車票",
						"rectScale": "86:54"
					}, {
						"name": "自定義",
						"rectScale": "custom"
					}];
				} else {//简体中文
					defaultRectScaleList = [{
						"name": "A4纸",
						"rectScale": "210:297"
					}, {
						"name": "增值税",
						"rectScale": "233:150"
					}, {
						"name": "火车票",
						"rectScale": "86:54"
					}, {
						"name": "自定义",
						"rectScale": "custom"
					}];
				}

				//原始未初始化的逻辑
				op.rectScaleList = op.rectScaleList || defaultRectScaleList;
				iPhoto.successCallback = successCallback;
				iPhoto.errorCallback = errorCallback;
				var url = op.url || gsPath + options.type;
				url = toAbsURL(url);
				// 封装参数
				var param = {
					success: "imp.iPhoto.openSuccessCallback",
					fail: "imp.iPhoto.openErrorCallback",
					options: op,
					uploadUrl: url
				};

				if (imp.os.android) {
					imp.invoke(adrSvr, "takePhotoAndUpload", j2s(param));
				} else {
					imp.invoke("PhotoService", "takePhotoAndUpload", param);
				}
			});
		};


		/**
		 *
		 * 成功回调
		 *
		 * @param info
		 *       输出信息
		 */
		iPhoto.openSuccessCallback = function(info) {
			//回调
			if (typeof info != 'object') {
				info = eval("(" + info + ")");
			}

			iPhoto.successCallback && iPhoto.successCallback(info);
		};

		iPhoto.openErrorCallback = function(info) {
			//回调
			iPhoto.errorCallback && iPhoto.errorCallback(info);
		};

		/**
		 * 从相册获取图片
		 *
		 * @param options
		 *            图片选择参数
		 * @param successCallback
		 *            图片选择成功回调函数
		 *
		 * @param errorCallback
		 *            图片选择失败回调函数
		 *
		 */
		iPhoto.selectAndUpload = function(options, successCallback, errorCallback) {

			if (!imp.os.isInYJ) {
				alert('takePhotoAndUpload is only support bu yun+');
				return;
			}
			if (typeof options != 'object') {
				alert('options must be a object!');
				return;
			}

			var op = options;
			op.quality = op.quality || 90;
			op.encodingType = op.encodingType || 0;
			op.picTotal = op.picTotal || 6;

			iPhoto.chooseSuccessCallback = successCallback;
			iPhoto.chooseErrorCallback = errorCallback;
			var url = op.url || gsPath + options.type;
			url = toAbsURL(url);
			// 封装参数
			var param = {
				success: "imp.iPhoto.selectSuccessCallback",
				fail: "imp.iPhoto.selectErrorCallback",
				options: op,
				uploadUrl: url
			};

			if (imp.os.android) {
				imp.invoke(adrSvr,
					"selectAndUpload", j2s(param));
			} else {
				imp.invoke("PhotoService", "selectAndUpload", param);
			}

		};
		/**
		 *
		 * 成功回调
		 *
		 * @param info
		 *       输出信息
		 */
		iPhoto.selectSuccessCallback = function(info) {
			//回调
			if (typeof info != 'object') {
				info = eval("(" + info + ")");
			}
			iPhoto.chooseSuccessCallback && iPhoto.chooseSuccessCallback(info);
		};

		iPhoto.selectErrorCallback = function(info) {
			//回调
			iPhoto.chooseErrorCallback && iPhoto.chooseErrorCallback(info);
		};

		iPhoto.browse = function(options) {
			if (options.img) {
				for (var i = 0; i < options.img.length; i++) {
					options.img[i].imgUrl = toAbsURL(options.img[i].imgUrl);
					options.img[i].originImgUrl = toAbsURL(options.img[i].originImgUrl);
				}
				if (!!imp.os.android) {
					imp.invoke(adrSvr, "viewImage", j2s(options));
				} else {
					var param = {
						options: options
					};
					imp.invoke("PhotoService", "viewImage", param);
				}
			}

		};

		iPhoto.save = function(ops, success, fail) {
			return imp.plugin("PhotoService", "savePhoto", ops, success, fail);
		};

		iPhoto.selectPicsFromAlbum = function(ops, success, fail) {
			return imp.plugin("PhotoService", "selectPicsFromAlbum", ops, success, fail);
		};

		return iPhoto;
	})(imp.iPhoto || {});


	imp.iSms = (function(iSms) {
		var svr = "com.inspur.imp.plugin.sms.SmsService";
		/**
		 * 打开系统发送短信的界面，根据传入参数自动填写好相关信息
		 *
		 * @param telNo
		 *            电话号码
		 * @param msg
		 *            消息内容
		 */
		iSms.open = function(telNo, msg) {
			// 封装参数
			var param = {
				tel: telNo,
				msg: msg
			}

			if (imp.os.ios) {
				imp.invoke("SmsService", "open", param);
			} else if (imp.os.android) {
				imp.invoke(svr, "open", JSON
					.stringify(param));
			}
		};

		/**
		 * 直接发送短信
		 *
		 * @param telNo
		 *            电话号码
		 * @param msg
		 *            消息内容
		 */
		iSms.send = function(telNo, msg, successCallback, errorCallback) {

			if (telNo != "" && msg != "") {
				iSms.successCallback = successCallback;
				iSms.errorCallback = errorCallback;
				// 封装参数
				var param = {
					tel: telNo,
					msg: msg,
					successCb: "imp.iSms.oSuccessCallback",
					errorCb: "imp.iSms.oErrorCallback"
				}

				if (imp.os.ios) {
					imp.invoke("SmsService", "send", param);
				} else if (imp.os.android) {
					imp.invoke(svr, "send", JSON
						.stringify(param));
				}
			} else {
				imp.iWindow.getAppLanguage({}, function(info) {
					let jsState = Number(info.state);
					let appAppLanguage = "zh-Hans";

					if (jsState == 1) {
						//获取当前的语言系统
						appAppLanguage = info.result.data.language;
					} else {
						//获取失败 默认值使用简体中文
						appAppLanguage = "zh-Hans";
					}

					let phoneTip = "电话号码不能为空";
					let msgTip = "短信内容不能为空";
					if (appAppLanguage === "en") {
						phoneTip = "Phone number cannot be empty";
						msgTip = "SMS content cannot be empty";
					} else if (appAppLanguage === "zh-Hant") {
						phoneTip = "電話號碼不能為空";
						msgTip = "短信內容不能為空";
					}

					if (telNo == "") {
						window.alert(phoneTip);
						return;
					}
					if (msg == "") {
						window.alert(msgTip);
						return;
					}
				});

			}

		};

		iSms.sendGroup = function(options, successCallback, errorCallback) {

		};

		/**
		 *
		 * 成功回调
		 *
		 * @param info
		 *       输出信息
		 */
		iSms.oSuccessCallback = function() {
			//回调
			iSms.successCallback && iSms.successCallback();
		};

		iSms.oErrorCallback = function() {
			//回调
			iSms.errorCallback && iSms.errorCallback();
		};

		return iSms;
	})(imp.iSms || {});

	imp.iTel = (function(iTel) {

		var svr = "com.inspur.imp.plugin.telephone.TelephoneService";
		/**
		 * 打开手机拨号界面
		 *
		 * @param telNo
		 *            电话号码
		 */
		iTel.dial = function(telNo) {
			// 封装参数
			var param = {
				tel: telNo
			};

			if (imp.os.ios) {
				imp.invoke("TelephoneService", "dial", param);
			} else if (imp.os.android) {
				imp.invoke(svr, "dial", JSON
					.stringify(param));
			}
		};

		/**
		 * 直接拨打电话
		 *
		 * @param telNo
		 * 电话号码
		 */
		iTel.call = function(telNo) {
			if (telNo && telNo != "" ) {
				// 封装参数
				var param = {
					tel: telNo
				};

				if (imp.os.ios) {
					imp.invoke("TelephoneService", "call", param);
				} else if (imp.os.android) {
					imp.invoke(svr, "call", JSON.stringify(param));
				}
			} else {
				imp.iWindow.getAppLanguage({}, function(info) {
					let jsState = Number(info.state);
					let appAppLanguage = "zh-Hans";

					if (jsState == 1) {
						//获取当前的语言系统
						appAppLanguage = info.result.data.language;
					} else {
						//获取失败 默认值使用简体中文
						appAppLanguage = "zh-Hans";
					}

					let phoneTip = "电话号码不能为空";
					if (appAppLanguage === "en") {
						phoneTip = "Phone number cannot be empty";
					} else if (appAppLanguage === "zh-Hant") {
						phoneTip = "電話號碼不能為空";
					}
					window.alert(phoneTip);
				});
			}

		};
		return iTel;
	})(imp.iTel || {});

	imp.iFile = (function(iFile) {
		var downloadUrl = function(url) {
			url = toAbsURL(url);
			if (!!imp.os.android) {
				imp.invokeAndReturn(imp.IAS, "downloadFile", j2s({
					key: url
				}));
			} else {
				var param = {
					url: url,
					fileName: ''
				};
				imp.invoke("FileTransferService", "download", param);
			}
		};

		/*
			参数说明
			//@param options ：options 是一个 Json对象， 属性包括为：
			//@param url ：（必选）string, 传入需要下载的URL地址
			//@param autoOpen ：（可选）boolean, 是否自动打开文件，默认false
			//@param saveName：（必选）string, 保存到本地的文件名
			//@param headers: JsonObj，请求头，包含cookie：“【{cookie ：12345},{}...】”
			//@param callBack(data) ：function，音频上传成功的回调函数，,该函数包含一个 data（JSON Object） 参数,
			//@param data 包含属性如下：
			//@param status ： int， 执行状态，0业务处理失败，1业务处理成功，2用户取消
			//@param errormessage ：string， 业务处理失败错误消息
			//@param result：（JSON Object）,执行返回json结果集
			*/
		iFile.download = function(op, success) {
			if (!isObj(op)) {
				downloadUrl(op);
				return;
			}
			return imp.plugin("FileTransferService", "saveFile", op, success);
		};
		iFile.select = function(ops, success) {
			if (typeof ops == "function") {
				success = ops;
				ops = {};
			}
			if (!ops.maximum) {
				ops.maximum = 0;
			}
			return imp.plugin("FileTransferService", "selectFile", ops, success);

		};

		//获取分块图片
		iFile.getBlockLocalImg = function(ops, success) {
			return imp.plugin("FileTransferService", "getBlockLocalImg", ops, success);
		};

		//获取分块视频
		iFile.getBlockLocalVideo = function(ops, success) {
			return imp.plugin("FileTransferService", "getBlockLocalVideo", ops, success);
		};

		iFile.base64Success = function(data) {
			iFile._base64Success && iFile._base64Success(data);
		};

		iFile.getBase64 = function(filePath, success) {
			var param = {
				success: "imp.iFile.base64Success",
				options: {
					"filePath": filePath
				}
			};
			iFile._base64Success = success;
			imp.ivk("FileTransferService", "base64File", param);
		};

		iFile.uploadFiles = function(options, suc, fail) {

			return imp.plugin("FileTransferService", "upload", options, suc, fail);

		};

		iFile.list = function(options, suc, fail) {
			return imp.plugin("FileTransferService", "listFile", options, suc, fail);
		};

		iFile.delete = function(options, suc, fail) {
			return imp.plugin("FileTransferService", "deleteFile", options, suc, fail);
		};

		return iFile;
	})(imp.iFile || {});

	imp.iLog = (function(iLog) {
		var p = "FileTransferService";
		iLog.read = function(op, suc, fail) {
			if (op) {
				imp.plugin(p, "readFile", op, suc, fail);
			} else {
				imp.iWindow.getAppLanguage({}, function(info) {
					let jsState = Number(info.state);
					let appAppLanguage = "zh-Hans";

					if (jsState == 1) {
						//获取当前的语言系统
						appAppLanguage = info.result.data.language;
					} else {
						//获取失败 默认值使用简体中文
						appAppLanguage = "zh-Hans";
					}

					let alertStr = "options 不能为空！";
					if (appAppLanguage === "en") {
						alertStr = "options Cannot be empty！";
					} else if (appAppLanguage === "zh-Hant") {
						alertStr = "options 不能為空！";
					}
					window.alert(alertStr);
				});
			}
		};

		iLog.write = function(op, suc, fail) {
			imp.plugin(p, "writeFile", op, suc, fail);
		};
		return iLog;
	})(imp.iLog || {});

	//人员服务
	imp.iStaff = (function(iStaff) {
		//选择人
		iStaff.select = function(options, success, fail) {
			var p = imp.os.android ? "com.inspur.imp.plugin.staff.SelectStaffService" :
				"SelectStaffService";
			imp.plugin("SelectStaffService", "select", options, success, fail);
		};

		//查看人员信息
		iStaff.info = function(options) {
			if (!isObj(options)) {
				options = {
					inspurId: options
				}
			}
			imp.plugin("StuffInformationService", "view", options);
		};

		iStaff.userInfo = function(success, fail) {
			imp.plugin("StuffInformationService", "userInfo", null, success, fail);
		}
		return iStaff;

	})(imp.iStaff || {});

	imp.iForm = (function(iForm) {

		iForm.select = function(options) {
			options = [{
				name: "name1",
				value: "value1",
				select: false
			}, {
				name: "name2",
				value: "value2",
				select: true
			}, {
				name: "name3",
				value: "value3",
				select: false
			}];
		};

		iForm.date = function(options) {
			options = {
				type: "date", //datetime
				selectedValue: '2018/5/1',
				minValue: '1900/1/1',
				maxValue: '9999/1/1'
			};
		}


	})(imp.iForm || {});

	imp.openApp = function(options) {
		if (imp.os.android) {
			if (!options.packageName && !options.intentUri) {
				alert("packageName or intentUri is required!");
				return false;
			}
			imp.invoke("StartAppService", "open", j2s(options));
		} else {
			imp.callbacks.openAppFail = options.fail || function() {};
			var param = {
				uri: options.uri || options,
				fail: "imp.callbacks.openAppFail"
			};
			imp.invoke("OpenThirdAppService", "open", param);
		}
	};

	// 手机前台后台事件监听
	imp.iAppService = (function(iAppService) {
		//设备事件
		iAppService.addAppEnterBackgroundListener = function(success) {
			if (typeof success !== "function") {
				return;
			}
			imp.plugin("AppService", "addAppEnterBackgroundListener", null, success, null);
		};

		iAppService.addAppEnterForegroundListener = function(success) {
			if (typeof success !== "function") {
				return;
			}
			imp.plugin("AppService", "addAppEnterForegroundListener", null, success, null);
		};

		iAppService.removeAppEnterBackgroundListener = function(success) {
			if (typeof success !== "function") {
				return;
			}
			imp.plugin("AppService", "removeAppEnterBackgroundListener", null, success, null);
		};

		iAppService.removeAppEnterForegroundListener = function(success) {
			if (typeof success !== "function") {
				return;
			}
			imp.plugin("AppService", "removeAppEnterForegroundListener", null, success, null);
		};
		return iAppService;

	})(imp.iAppService || {});

	imp.iShareTo3rdApp = (function(iShare) {

		iShare.shareText = function(op, success, fail) {
			if (op) {
				if (!isObj(op)) {
					op = {
						text: op
					};
				}

				imp.plugin("ShareSocialService", "shareText", op, success, fail);
			} else {
				imp.iWindow.getAppLanguage({}, function(info) {
					let jsState = Number(info.state);
					let appAppLanguage = "zh-Hans";

					if (jsState == 1) {
						//获取当前的语言系统
						appAppLanguage = info.result.data.language;
					} else {
						//获取失败 默认值使用简体中文
						appAppLanguage = "zh-Hans";
					}

					let alertStr = "options 不能为空！";
					if (appAppLanguage === "en") {
						alertStr = "options Cannot be empty！";
					} else if (appAppLanguage === "zh-Hant") {
						alertStr = "options 不能為空！";
					}
					window.alert(alertStr);
				});
			}
		};

		// op: object，如下：
		//@param webpageUrl 要分享url ,必须
		//@param title 标题 可选
		//@param descr 描述 可选
		//@param thumImage 缩略图，图片url 可选

		iShare.shareUrl = function(op, success, fail) {
			imp.plugin("ShareSocialService", "shareUrl", op, success, fail);
		};


		// op: object，如下：
		//@param shareImage 要分享图片的url ,必须
		//@param title 标题 可选
		//@param descr 描述 可选
		//@param thumImage 缩略图，图片url 可选
		iShare.shareImage = function(op, success, fail) {
			imp.plugin("ShareSocialService", "shareImage", op, success, fail);
		};

		return iShare;
	})(imp.iShareTo3rdApp || {});

	imp.iVideo = (function(iVideo) {
		//视频录制
		// op: object，如下：
		//@param quality 视频质量 取值范围0~1
		//@param id 视频id（视频名字）
		//@param time 返回Base64数据时，短视频时间（秒) 最多15s
		//success: object,如下：
		//@param status 执行状态，0业务处理失败，1业务处理成功
		//@param result 是执行结果数据：
		// 如下：
		//@param base64 读取出来的base64字符串
		//@param value 文件路径
		//@param duration 时长单位秒
		//@param type 格式
		//@param fileSize 单位字节
		//@param name 名字
		//fail: object,如下：
		//@param status 执行状态，0业务处理失败，1业务处理成功
		//@param errormessage 错误消息
		iVideo.record = function(op, success, fail) {
			op.fps = op.fps || 30;
			imp.plugin("VideoService", "recordVideo", op, success, fail);
		};

		iVideo.play = function(op, success, fail) {
			imp.plugin("VideoService", "playVideo", op, success, fail);
		};
		return iVideo;
	})(imp.iVideo || {});

	//音频录制上传、播放
	imp.iAudio = (function(iAudio) {
		/*参数说明
		//@param options ：options 是一个 Json对象， 属性包括为：
		//@param local ：（可选） boolean，是否存储本地，true存，false不存，默认false
		//@param id ：（必选） string ，上传接口
		//@param callBack(data) ：function，视频音频上传成功的回调函数，,该函数包含一个 data（JSON Object） 参数,
		//@param data 包含属性如下：
		//@param status ： int 执行状态，0业务处理失败，1业务处理成功，2用户取消
		//@param errormessage ：string 业务处理失败错误消息
		//@param result：（JSON Object）,上传返回的结果，包含的属性如下：
		//@param respone ：any 上传接口返回数据,
		//@param localPath ：string 存储本地路径地址（仅调用参数中的local为true时存在）
		*/
		iAudio.recordingAudio = function(op, success, fail) {
			imp.plugin("IMPAudioService", "recordingAudio", op, success, fail);
		};

		/*
	    参数说明
	    //@param options ：options 是一个 Json对象， 属性包括为：
	    //@param absolute ：（可选） boolean 是否绝对路径，true: 绝对路径，false: 相对路径,默认true
	    //@param path ：（必选）string 音频路径
	    //@param value ：（必选）string 播放动作，取值范围：start（开始播放）/ stop（结束播放）
	    //@param callBack(data) ：function，音频播放的回调函数，,该函数包含一个 data（JSON Object） 参数,
	    //@param data 包含属性如下：
	    //@param status ： int 执行状态，0业务处理失败，1业务处理成功，2用户取消
	    //@param errormessage ：string 错误消息
	    //@param result：（JSON Object）,执行结果数据，包含的属性如下：
	    //@param value ：string stop（结束播放）, error（失败）
	  */
		iAudio.playAudio = function(op, success, fail) {
			imp.plugin("IMPAudioService", "playAudio", op, success, fail);
		};
		return iAudio;
	})(imp.iAudio || {});

	imp.iHttp = (function(iHttp) {
		iHttp.get = function(url, success, fail) {
			var op = {
				url: url
			};
			imp.plugin("HttpService", "get", op, success, fail);
		};

		iHttp.post = function(options, success, fail) {
			imp.plugin("HttpService", "post", options, success, fail);
		};

		return iHttp;
	})(imp.iHttp || {});

	imp.iWechat = (function(iWechat) {
		iWechat.invoice = function(success, fail) {
			imp.plugin("WechatService", "invoice", null, success, fail);
		};

		return iWechat;
	})(imp.iWechat || {});

	imp.iScreenshot = (function(iScreenshot) {
		iScreenshot.start = function(op, success, fail) {
			imp.plugin("ScreenshotService", "do", op, success, fail);
		};

		return iScreenshot;
	})(imp.iScreenshot || {});

	//社会化分享
	imp.iShareSocialService = (function(iShare) {

		// op: object，如下：
		//@param shareText 要分享的文字 ,必须
		iShare.shareText = function(op, success, fail) {
			if (op) {
				if (!isObj(op)) {
					op = {
						text: op
					};
				}

				imp.plugin("ShareSocialService", "shareText", op, success, fail);
			} else {
				imp.iWindow.getAppLanguage({}, function(info) {
					let jsState = Number(info.state);
					let appAppLanguage = "zh-Hans";

					if (jsState == 1) {
						//获取当前的语言系统
						appAppLanguage = info.result.data.language;
					} else {
						//获取失败 默认值使用简体中文
						appAppLanguage = "zh-Hans";
					}

					let alertStr = "options 不能为空！";
					if (appAppLanguage === "en") {
						alertStr = "options Cannot be empty！";
					} else if (appAppLanguage === "zh-Hant") {
						alertStr = "options 不能為空！";
					}
					window.alert(alertStr);
				});
			}
		};

		// op: object，如下：
		//@param webpageUrl 要分享url ,必须
		//@param title 标题 可选
		//@param descr 描述 可选
		//@param thumImage 缩略图，图片url 可选

		iShare.shareUrl = function(op, success, fail) {
			imp.plugin("ShareSocialService", "shareUrl", op, success, fail);
		};

		// op: object，如下：
		// shareImage, `string`,（与base64ShareImage 二选一）要分享图片的url；
		// base64ShareImage, `string`,（与shareImage 二选一）要分享图片的base64字符串; 
		// title, `string`,（可选）标题;
		// descr，`string`，（可选）描述;
		// thumImage，`string`，（可选）缩略图，图片url;
		// base64ThumbImage，`string`，（可选）缩略图，图片的base64字符串。
		iShare.shareImage = function(op, success, fail) {
			imp.plugin("ShareSocialService", "shareImage", op, success, fail);
		};

		return iShare;
	})(imp.iShareSocialService || {});

	// 蓝牙
	imp.iBlueTooth = (function(iBlueTooth) {
		iBlueTooth.open = function(success, fail) {
			imp.plugin("BlueToothService", "open", null, success, fail);
		};

		iBlueTooth.close = function(success, fail) {
			imp.plugin("BlueToothService", "close", null, success, fail);
		};

		iBlueTooth.scan = function(success, fail) {
			imp.plugin("BlueToothService", "scan", null, success, fail);
		};

		iBlueTooth.cancelScan = function(success, fail) {
			imp.plugin("BlueToothService", "cancelScan", null, success, fail);
		};

		iBlueTooth.getState = function(success, fail) {
			imp.plugin("BlueToothService", "getState", null, success, fail);
		};

		iBlueTooth.updateState = function(params, success, fail) {
			imp.plugin("BlueToothService", "updateState", params, success, fail);
		};

		iBlueTooth.connect = function(params, success, fail) {
			imp.plugin("BlueToothService", "connectDevice", params, success, fail);
		};

		return iBlueTooth;
	})(imp.iBlueTooth || {});

	//NFC获取数据
	imp.iNFCService = (function(iNFC) {

		iNFC.getNFCInfo = function(success, fail) {
			imp.plugin("NFCService", "getNFCInfo", null, success, fail);
		};

		return iNFC;
	})(imp.iNFCService || {});

	imp.iPDA = (function (iPDA) {

		/**
		 * 初始化pda
		 * @param success 成功回调
		 * @param fail 失败回调
		 */
		iPDA.init = function (success, fail) {
			imp.plugin("PDAService", "init", null, success, fail);
		};

		/**
		 * 注册头部激光扫码监听
		 * @param options 预留参数，可传空
		 * @param success 数据回调
		 * @param fail 失败回调
		 */
		iPDA.registerScanHeaderBroadcastReceiver = function (options, success, fail) {
			imp.plugin("PDAService", "registerScanHeaderBroadcastReceiver", options, success, fail);
		};

		/**
		 * 反注册头部激光扫码监听
		 * @param options 预留参数，可传空
		 * @param success 成功回调
		 * @param fail 失败回调
		 */
		iPDA.unregisterScanHeaderBroadcastReceiver = function (options, success, fail) {
			imp.plugin("PDAService", "unregisterScanHeaderBroadcastReceiver", options, success, fail);
		};
		return iPDA;
	})(imp.iPDA || {});

	win.imp = imp;
})(navigator.userAgent, window);

if (typeof module === "object" && module && typeof module.exports === "object") {
	module.exports = window.imp;
} else {
	if (typeof define === "function" && define.amd) {
		define("imp", [], function() {
			return window.imp;
		});
	}
}

