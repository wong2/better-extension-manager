/*
 *  Author: wong2
 *  Email: wonderfuly@gmail.com
 *  Blog: http://wong2.cn
 *  Date: 2011/6/10
 *  License: WTFPL(http://sam.zoy.org/wtfpl/COPYING)
 */

chrome.management.getAll(function(all){
    var config = {
        filter_type: { 
            "ALL":0, "APP":1, "EXT":2, "NAME":3, 
            "STARED":4, "ENABLED":5, "DISABLED":6
        },
        url: { "option" : "optionsUrl", "launch" : "appLaunchUrl"},
        tab_now: 0,
        //my_id: "gnnggbedbbegbdnmimdhkhkfdcikfnjl"
        my_id : chrome.i18n.getMessage("@@extension_id")
    };
    var exts = $.grep(all, function(ext){
        return ext.id !== config.my_id;
    }).sort(function(ext1, ext2){
        return ext1.name===ext2.name?0:(ext1.name<ext2.name?-1:1);
    });
    var operations = function(){
        var enableExt = function(ext, button){
            chrome.management.setEnabled(ext.id, true, function(){
                setHighlight(ext.element, true);
                ext.enabled = true;
                if(button){
                    button.val("disable").click(function(){
                        disableExt(ext, button);
                    });
                }
            });
        };
        var disableExt = function(ext, button){
            chrome.management.setEnabled(ext.id, false, function(){
                setHighlight(ext.element, false);
                ext.enabled = false;
                if(button){
                    button.val("enable").click(function(){
                        enableExt(ext, button);
                    });
                }
            });
        };
        var uninstallExt = function(ext){
            chrome.management.uninstall(ext.id, function(){});
            ext.element.remove();
            exts = $.grep(exts, function(value) {
                return value !== ext;
            });
        };
        
        return {
            enableExt: enableExt,
            disableExt: disableExt,
            uninstallExt: uninstallExt
        }
    }();
    
    function setHighlight(element, highlight){
        if(highlight){
            element.removeClass("disabled").addClass("enabled");
        } else {
            element.removeClass("enabled").addClass("disabled");
        }
    }
    function setSidebarHighlight(element){
        $("#filter>li").removeClass("highlight");
        $(element).parent().addClass("highlight");
    }
    
    $.each(exts, function(i, ext){
        ext.stared = ext.id in localStorage;
        ext.icon = ext.hasOwnProperty("icons") ?
            ext.icons[ext.icons.length-1].url : "images/default.png";
        ext.name_low = ext.name.toLowerCase();
        ext.element = $("#listTemplate").tmpl(ext);
        ext.element.appendTo("#ext-list");
        var tmp = ext.element[0];
        var star_img = $(tmp.getElementsByClassName("ext-star")[0]);
        star_img.click(function(){
            if(ext.stared){
                localStorage.removeItem(ext.id);
                star_img.attr("src", "images/star0.png");
            }
            else{
                localStorage.setItem(ext.id, 1);
                star_img.attr("src", "images/star1.png");
            }
            ext.stared = !ext.stared;
        });
        inputs = tmp.getElementsByTagName("input");
        $.each(inputs, function(i, input){
            var type = input.value;
            var input = $(input);
            if(type === "enable" || type === "disable" || type === "uninstall"){
                if(type !== "uninstall"){
                    ext.button = input;
                }
                input.click(function(){
                    var tmp = true;
                    if(type === "uninstall"){
                        tmp = confirm("Confirm uninstall this extension?");
                    }
                    if(tmp){
                        operations[type + "Ext"](ext, input);
                    }
                });
            } else if (type === "option" || type === "launch") {
                input.click(function(){
                    window.open(ext[config.url[type]], '_newtab');
                });
            } else if (input.attr("type") === "checkbox") {
                ext.checkbox = input;
            }
        });
    });
    var action = function(func){
        $.each(exts, function(i, ext){
            var element = ext.element;
            func(ext)?element.show():element.hide();
        }); 
    };
    var filter = function(filter_type, filter_value){
        switch(filter_type){
            case config.filter_type.ALL:
                action(function(){
                    return 1;
                });
                break;
            case config.filter_type.APP:
                action(function(ext){
                    return ext.isApp;
                });
                break;
            case config.filter_type.EXT:
                action(function(ext){
                    return !ext.isApp;
                });
                break;
            case config.filter_type.STARED:
                action(function(ext){
                    return ext.stared;
                });
                break;
            case config.filter_type.ENABLED:
                action(function(ext){
                    return ext.enabled;
                });
                break;
            case config.filter_type.DISABLED:
                action(function(ext){
                    return !ext.enabled;
                });
                break;
            case config.filter_type.NAME:
                action(function(keyword){
                    return function(ext){
                        return !keyword || ext.name_low.indexOf(keyword)>-1;
                    }
                }(filter_value));
        }
    };
    
    $("#all, #app, #ext, #stared, #enabled, #disabled").click(function(){
        var filter_type = config.filter_type[this.id.toUpperCase()];
        if(config.tab_now !== filter_type){
            filter(filter_type);
            setSidebarHighlight(this);
            $("body").scrollTop(0);
            $("#keyword").val("").focus();
            config.tab_now = filter_type;
            $(":checkbox").attr("checked", false);
        }
    });
    $("#keyword").keyup(function(){
        var keyword = $.trim(this.value.toLowerCase());
        filter(config.filter_type.NAME, keyword);
        $("body").scrollTop(0);
    });
    
    var check_all_box = $("#batch>input:checkbox");
    check_all_box.attr("checked", false).click(function(){
        var ischecked = this.checked;
        $.each(exts, function(i, ext){
            if(ext.element.is(":visible")){
                ext.checkbox.attr("checked", ischecked);
            }
        });
    });
    
    $("#batch_enable, #batch_disable, #batch_uninstall").click(function(){
        var tmp = true;
        var type = this.id.split("_")[1];
        if(type === "uninstall"){
            tmp = confirm("Confirm uninstall these extensions?");
        }
        if(tmp){
            $.each(exts, function(i, ext){
                if(ext.checkbox.is(":checked")){
                    console.log(ext.button);
                    operations[type+"Ext"](ext, ext.button);
                }
                ext.checkbox.attr("checked", false);
            });
            check_all_box.attr("checked", false);
        }
    });
});
