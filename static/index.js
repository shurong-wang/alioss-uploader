// Initialize the widget when the DOM is ready
$(function() {

    var oss_config = {
        host: 'https://***.***.aliyuncs.com', // OSS 访问域名
        accessid: 'LTA***ScS', // AccessKeyId
        accesskey: '3m3***emj', // AcessKeySecret
     }
     
     Date.prototype.Format = function (fmt) { // author: meizz
         var o = {
             "M+": this.getMonth() + 1, // 月份
             "d+": this.getDate(), // 日
             "h+": this.getHours(), // 小时
             "m+": this.getMinutes(), // 分
             "s+": this.getSeconds(), // 秒
             "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
             "S": this.getMilliseconds() // 毫秒
         };
         if (/(y+)/.test(fmt))
             fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
         for (var k in o)
             if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                 return fmt;
     }
     
     function random_string(len) {
         len = len || 32;
         // var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
         var chars = 'abcdefhijkmnprstwxyz';
         var maxPos = chars.length;
         var rnds = '';
         for (i = 0; i < len; i++) {
             rnds += chars.charAt(Math.floor(Math.random() * maxPos));
         }
         return rnds;
     }
     
     function format_filename(filename) {
         var nowTime = new Date().Format("yyyy-MM-dd_hh:mm:ss");
         var rndStr = random_string(3);
         var pos = filename.lastIndexOf('.')
         var fname = filename
         var suffix = ''
         if (pos != -1) {
             suffix = filename.substring(pos)
             fname = filename.replace(suffix, '') || '.'
         }
         return fname + "." + nowTime + "_" + rndStr + suffix;
     }
     
     // Plupload 发送 POST 请求时, 带上 OSS 签名
     function gen_multipart_params(filename){
        var policyText = {
            // 为Policy指定有效时长，格式为UTC时间。Policy失效后，无法再上传文件
            "expiration": "2022-10-01T00:00:00.000Z", 
            // 设置上传文件的大小限制。如果超过此限制，文件上传到OSS会报错
            "conditions": [
                ["content-length-range", 0, 512 * (1000 * 1024 * 1024)] // 512mb
            ]
        };
        var policyBase64 = Base64.encode(JSON.stringify(policyText));
    
        // 上传签名: 主要是对 policyText 进行签名
        var bytes = Crypto.HMAC(Crypto.SHA1, policyBase64, oss_config.accesskey, { asBytes: true }) ;
        var signature = Crypto.util.bytesToBase64(bytes);
    
        return {
            'key': "CICC/" + format_filename(filename), // 上传后的文件路径
            'policy': policyBase64,
            'OSSAccessKeyId': oss_config.accessid, 
            'success_action_status' : '200', // 文件上传成功后返回状态码
            'signature': signature,
        };
    }
    
	$("#uploader").plupload({
		// General settings
		runtimes : 'html5,flash,silverlight,html4',
        url : 'http://oss.aliyuncs.com',

		// User can upload no more then 20 files in one go (sets multiple_queues to false)
		max_file_count: 10,
		
		chunk_size: '1mb',

		// Resize images on clientside if we can
		resize : {
			width : 200, 
			height : 200, 
			quality : 90,
			crop: true // crop to exact dimensions
		},
		
		filters : {
			// Maximum file size
			max_file_size : '100mb',
			// Specify what files to browse for
			mime_types: [
				{ title : "Office documents", extensions : "xls,xlsx" },
				// {title : "Zip files", extensions : "zip"}
			],
            // 不允许选取重复文件
            prevent_duplicates : true
		},

		// Rename files by clicking on their titles
		rename: true,
		
		// Sort files
		sortable: true,

		// Enable ability to drag'n'drop files onto the widget (currently only HTML5 supports that)
		dragdrop: true,

		// Views to activate
		views: {
			list: true,
			thumbs: true, // Show thumbs
			active: 'thumbs'
		},

		// Flash settings
		flash_swf_url : '../../js/Moxie.swf',

		// Silverlight settings
		silverlight_xap_url : '../../js/Moxie.xap',

        // --------------------------------------------------------------

        // PreInit events, bound before any internal events
        preinit : {
            // Init: function(up, info) {
            //     console.log('[Init]', 'Info:', info, 'Features:', up.features);
            // },

            UploadFile: function(up, file) {
                // console.log('[UploadFile]', file);
                // You can override settings before the file is uploaded
                up.setOption('url', oss_config.host);
            }
        },

        init : {
            // Browse: function(up) {
            //     // Called when file picker is clicked
            //     console.log('[Browse]');
            // },
 
            // Refresh: function(up) {
            //     // Called when the position or dimensions of the picker change
            //     console.log('[Refresh]');
            // },
  
            BeforeUpload: function(up, file) {
                // Called right before the upload for a given file starts, can be used to cancel it if required
                // console.log('[BeforeUpload]', 'File: ', file);
                up.setOption({
                    // multipart_params: 上传时的附加参数, 提供给服务器端
                    'multipart_params': gen_multipart_params(file.name)
                });
            },
  
            // UploadProgress: function(up, file) {
            //     // Called while file is being uploaded
            //     console.log('[UploadProgress]', 'File:', file, "Total:", up.total);
            // },
 
            // FilesAdded: function(up, files) {
            //     // Called when files are added to queue
            //     console.log('[FilesAdded]');
  
            //     plupload.each(files, function(file) {
            //         console.log('  File:', file);
            //     });
            // },
  
            // FileUploaded: function(up, file, info) {
            //     // Called when file has finished uploading
            //     console.log('[FileUploaded] File:', file, "Info:", info);
            // },

            // UploadComplete: function(up, files) {
            //     // Called when all files are either uploaded or failed
            //     console.log('[UploadComplete]');
            // },

            // Error: function(up, args) {
            //     // Called when error occurs
            //     console.log('[Error] ', args);
            // }
        }
	});
});