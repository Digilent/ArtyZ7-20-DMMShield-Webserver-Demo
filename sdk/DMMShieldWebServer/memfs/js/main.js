var webserver = {
    init: function() {
        webserver.led_form = document.getElementById('led_form');
        webserver.txtOutput = document.getElementById('txtOutput');
        webserver.scaleType = document.getElementById('scaleType');
		webserver.ScaleTypeRadios = document.getElementsByName('scaleType');
		for (var i = 0, length = webserver.ScaleTypeRadios.length; i < length; i++)
		{
			webserver.ScaleTypeRadios[i].addEventListener('click', webserver.scaleType_changed);
		}
		webserver.ScaleCombos = document.getElementsByName('scale');
		for (var i = 0, length = webserver.ScaleCombos.length; i < length; i++)
		{
			webserver.ScaleCombos[i].addEventListener('change', webserver.scale_changed);
		}
		// initialize class member variables
		webserver.requestDataFlag = 1;			// allow data request
		webserver.allowDataCallbackFlag = 1;	// allow data callback		
		webserver.ignoreScaleChangeFlag = 0;	// default, do not ignore scale combo change
		webserver.currentScale = -1;
		webserver.currentScaleText = "";
		webserver.currentScaleTypeText = "";
		webserver.visibleScaleCombos();
		setInterval(webserver.val_request, 1000);	// initialize timer function
		document.getElementById('statusTxt').innerHTML = 'init';
    },
	visibleScaleCombos: function() {
		for (var i = 0, length = webserver.ScaleTypeRadios.length; i < length; i++)
		{
			webserver.ScaleCombos[i].style.display = ((webserver.ScaleTypeRadios[i].checked) ? 'inline' : 'none');
			if(webserver.ScaleTypeRadios[i].checked)
			{
				webserver.currentScaleTypeText = webserver.ScaleTypeRadios[i].nextSibling.data;	// radio button text
			}
		}
    }, 	
	scaleType_changed: function(e) {
		webserver.visibleScaleCombos();
		if(!webserver.ignoreScaleChangeFlag)
		{		
			webserver.scale_changed(this);
		}	
    },  	
	scale_changed: function(e) {
		for (var i = 0, length = webserver.ScaleTypeRadios.length; i < length; i++)
		{
			if(webserver.ScaleTypeRadios[i].checked)
			{
				webserver.currentScale = Number(webserver.ScaleCombos[i].value);
				webserver.currentScaleText = webserver.ScaleCombos[i].options[webserver.ScaleCombos[i].selectedIndex].text;					
			}
		}		
		webserver.allowDataCallbackFlag = 0;	// deny data callback, to ignore data requested from the previous scale

		/* make a XMLHTTP request */
		webserver.requestDataFlag = 0;	// block data request
		var xhttpScale = new XMLHttpRequest();
		xhttpScale.onreadystatechange = webserver.scale_callback;
		xhttpScale.open("POST", "/cmd/sclxhr" + webserver.currentScale, true);
		xhttpScale.send();
	}, 	
   scale_callback: function() {
		   // extract scale (first 2 characters of the response text)
	   var callbackScale = Number(webserver.xhttpVal.responseText.substring(0, 2));
	   if(!isNaN(callbackScale))
	   {
		   // not error, the response text only contains scale ID (on 2 characters)
			document.getElementById('statusTxt').innerHTML = 'Scale changed to ' + webserver.currentScaleTypeText + '/ ' + webserver.currentScaleText;		   
	   }
	   else
	   {
			// the response contains an error message, display it in the status area
			webserver.txtOutput.value = 'ERROR'
			document.getElementById('statusTxt').innerHTML = 'ERROR: ' + webserver.xhttpVal.responseText;
	   }
		webserver.requestDataFlag = 1;	// allow data request
		webserver.allowDataCallbackFlag = 1;	// allow data callback
   },   
   val_request: function()  {
		/* make a XMLHTTP request */
		webserver.xhttpVal = new XMLHttpRequest();
		webserver.xhttpVal.onreadystatechange = webserver.val_callback;
		webserver.xhttpVal.open("POST", "/cmd/valxhr", true);
		webserver.xhttpVal.send();
   },      
   val_callback: function() {   
	   if (webserver.allowDataCallbackFlag == 1 && this.readyState == 4 && this.status == 200) 
	   {
		   // extract scale (first 2 characters of the response text)
		   var callbackScale = Number(webserver.xhttpVal.responseText.substring(0, 2));
		   if(!isNaN(callbackScale))
		   {
			   // not error, the response text contains scale (first 2 characters) and formatted value (the remaining characters)
			   var isChanged = (Number(callbackScale) != Number(webserver.currentScale));
			   if(isChanged)
			   {
				   // position the radios and the combos
					webserver.currentScale = callbackScale;
					webserver.ignoreScaleChangeFlag = 1;	// ignore scale combo change, avoid submitting the scale change request
					webserver.positionRadiosCombos();
					document.getElementById('statusTxt').innerHTML = 'Scale changed by others to ' + webserver.currentScaleTypeText + '/ ' + webserver.currentScaleText;
					webserver.ignoreScaleChangeFlag = 0;	// default, do not ignore scale combo change	
			   }
			   else
			   {
					webserver.txtOutput.value = webserver.xhttpVal.responseText.substring(2, webserver.xhttpVal.responseText.length);
					if(webserver.xhttpVal.responseText == '-1')
					{
					  document.getElementById('statusTxt').innerHTML = 'No scale selected';
					}
			   }			   
		   }
		   else
		   {
				// the response contains an error message, display it in the status area
				webserver.txtOutput.value = 'ERROR'
				document.getElementById('statusTxt').innerHTML = 'ERROR: ' + webserver.xhttpVal.responseText;

		   }
	   }
   },
	positionRadiosCombos: function() {
		var valInCombo;
		for (var i = 0, length = webserver.ScaleTypeRadios.length; i < length; i++)
		{
			valInCombo = false;
			// for each scale type radio 
			for (var j = 0; j < webserver.ScaleCombos[i].options.length; j++) 
			{
				// for each combo option
				if (webserver.ScaleCombos[i].options[j].value == webserver.currentScale) 
				{
					webserver.ScaleCombos[i].options[j].selected = true;
					webserver.currentScaleText = webserver.ScaleCombos[i].options[j].text;					
					webserver.currentScaleTypeText = webserver.ScaleTypeRadios[i].nextSibling.data;	// radio button text
					valInCombo = true;
				}
			}
			webserver.ScaleCombos[i].style.display = ((valInCombo) ? 'inline' : 'none');
			webserver.ScaleTypeRadios[i].checked = valInCombo;
			
		}		
    }, 	   

};


window.onload = webserver.init;

function popup(url) {
	newwindow = window.open(url, 'image', 'height=400,width=550,resizeable=1,scrollbards,menubar=0,toolbar=0');
	if (window.focus) {newwindow.focus()}
	return false;
}
