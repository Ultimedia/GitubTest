/* *****
    Caroline Clifford 2009
    http://www.accessibledesign.net
    This plugin is permitted for any kind of use
    
    DESCRIPTION:
    
        This plugin will allow you to verically center an element within its parent
    
        USAGE:
        
            $([selector]).valign([options])
            
        EG:
        
            $("p").valign();
        
    OPTIONS:
    
        wrap:[true] (false by default)
            
            If you wish to vertically align a group of elements that do not contain a suitable
            wrapper then set 'wrapper' to 'true' - this will by default place a <div></div> around
            your elements
            
            EG: $("p").valign({wrap:true})
            
        wrapper:[tag]
        
            If you require a custom wrapper
            
            EG: $("p").valign({wrapper:"<div class="wrapper"></div>"})
            
            NOTE: if you set wrapper then wrap is automatically set to true 
            
        halign:[true] (false by default)
        
            Horizontal align also?
        
***** */

(function($){ $.fn.valign = function(options){

        var defaults = {
    		wraps:false,
    		wrapper: "",
    		halign: false
    	};
    	
    	var T = this;
      
        options = $.extend(defaults, options);

        if(options.wrapper.length>0) {
            //custom wrapper is specified
                T.wrapAll(options.wrapper);
        } else if( (options.wraps==true) || T.parent().is("body")) {
            //no wrapper defined, use default
                T.wrapAll("<div></div>");  
                console.log(options.wraps==true);              
        }
        //shift focus of this to wrapper
            T=this.parent();
            
        TP = T.parent();
            
        if(TP.is("body")) {         
            //if the parent is the BODY then make the body & HTML 100% height
                TP.css("height","100%");
                $("html").attr("style","height:100%");
        }
        
        if(TP.css("position")!="absolute") TP.css("position","relative");
        T.css({
            "position":"absolute",
            "height":T.height(),
            "top":"50%",
            "left":"0px",
            "margin-top": 0-(T.height()/2)
        })
        if(options.halign) {
            T.css({
                "width":T.width(),
                "left":"50%",
                "margin-left": 0-(T.width()/2)
            })   
        }



  
}})(jQuery); 




