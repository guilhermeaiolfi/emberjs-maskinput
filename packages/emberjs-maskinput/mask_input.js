MI = {};
MI.MaskInput = Ember.TextField.extend({
	isIphone: function () { return (window.orientation != undefined) },
		// browsers like firefox2 and before and opera doenst have the onPaste event, but the paste feature can be done with the onInput event.
	pasteEvent: function (){
		return (jQuery.browser.opera || (jQuery.browser.mozilla && parseFloat(jQuery.browser.version.substr(0,3)) < 1.9 ))? 'input': 'paste';
	}.property().cacheable(),

	// these keys will be ignored by the mask.
	// all these numbers where obtained on the keydown event
	keyRepresentation : {
		8	: 'backspace',
		9	: 'tab',
		13	: 'enter',
		16	: 'shift',
		17	: 'control',
		18	: 'alt',
		27	: 'esc',
		33	: 'page up',
		34	: 'page down',
		35	: 'end',
		36	: 'home',
		37	: 'left',
		38	: 'up',
		39	: 'right',
		40	: 'down',
		45	: 'insert',
		46	: 'delete',
		116	: 'f5',
		123 : 'f12',
		224	: 'command'
	},

	iphoneKeyRepresentation : {
		10	: 'go',
		127	: 'delete'
	},

	signals : {
		'+' : '',
		'-' : '-'
	},

	attr: 'alt', // an attr to look for the mask name or the mask itself
	mask: null, // the mask to be used on the input
	type: 'fixed', // the mask of this mask
	maxLength: -1, // the maxLength of the mask
	defaultValue: '', // the default value for this input
	signal: false, // this should not be set, to use signal at masks put the signal you want ('-' or '+') at the default value of this mask.
	// See the defined masks for a better understanding.
	textAlign: true, // use false to not use text-align on any mask (at least not by the plugin, you may apply it using css)
	selectCharsOnFocus: true, // select all chars from input on its focus
	autoTab: true, // auto focus the next form element when you type the mask completely
	setSize: false, // sets the input size based on the length of the mask (work with fixed and reverse masks only)
	fixedChars : '[(),.:/ -]', // fixed chars to be used on the masks. You may change it for your needs!

	onInvalid : Ember.K,
	onValid : Ember.K,
	onOverflow : Ember.K,


	// masks. You may add yours!
	// Ex: jQuery.fn.setMask.masks.msk = {mask: '999'}
	// and then if the 'attr' options value is 'alt', your input should look like:
	// <input type="text" name="some_name" id="some_name" alt="msk" />
	masks : {
		'phone'				: { mask : '(99) 9999-9999' },
		'phone-us'			: { mask : '(999) 999-9999' },
		'cpf'				: { mask : '999.999.999-99' }, // cadastro nacional de pessoa fisica
		'cnpj'				: { mask : '99.999.999/9999-99' },
		'date'				: { mask : '39/19/9999' }, //uk date
		'date-us'			: { mask : '19/39/9999' },
		'cep'				: { mask : '99999-999' },
		'time'				: { mask : '29:59' },
		'cc'				: { mask : '9999 9999 9999 9999' }, //credit card mask
		'integer'			: { mask : '999.999.999.999', type : 'reverse' },				
		'decimal'			: { mask : '99,999.999.999.999', type : 'reverse', defaultValue : '000' },
		'decimal-us'		: { mask : '99.999,999,999,999', type : 'reverse', defaultValue : '000' },
		'signed-decimal'	: { mask : '99,999.999.999.999', type : 'reverse', defaultValue : '+000' },
		'signed-decimal-us' : { mask : '99,999.999.999.999', type : 'reverse', defaultValue : '+000' }
	},
	keyRep: function()
	{
		return this.isIphone()? this.iphoneKeyRepresentation : this.keyRepresentation;
	}.property('iphoneKeyRepresentation', 'keyRepresentation').cacheable(),
	
	ignoreKeys: function ()
	{
		var arr = [];
		jQuery.each(this.get('keyRep'),function(key){
			arr.push( parseInt(key) );
		});
		return arr;
	}.property().cacheable(),
	
	ignore: false,
	
	rules: function()
	{
		var rules = {
			'z': /[a-z]/,
			'Z': /[A-Z]/,
			'a': /[a-zA-Z]/,
			'*': /[0-9a-zA-Z]/,
			'@': /[0-9a-zA-ZÁ«·‡„‚ÈËÍÌÏÛÚÙı˙˘¸]/
		}, i;
		for(i=0; i<=9; i++) rules[i] = new RegExp('[0-'+i+']');
		return rules;
	}.property().cacheable(),
	
	didInsertElement: function() {
		this._updateElementValue();
				
		var $el = this.$(),
			mlStr = 'maxLength';
			
		if (this.mask) this.attr = this.mask;

		// then we see if it's a defined mask
		if(this.masks[this.mask]) this.mask = this.masks[this.mask];

		if(this.mask != null){

			// prevents javascript automatic type convertion
			this.mask += '';

			if($el.data('mask')) this.destroy();

			var reverse = (this.type=='reverse');
							
			this.fixedCharsRegG = new RegExp(this.fixedChars, 'g');

			if(this.maxLength == -1) this.maxLength = $el.attr(mlStr);

			this.fixedCharsReg = new RegExp(this.fixedChars);
			
			this.maskArray = this.mask.split('');
			
			this.maskNonFixedCharsArray = this.mask.replace(this.fixedCharsRegG, '').split('')
			
			//setSize option (this is not removed from the input (while removing the mask) since this would be kind of funky)
			if((this.type=='fixed' || reverse) && this.setSize && !$el.attr('size')) $el.attr('size', this.mask.length);

			//sets text-align right for reverse masks
			if(reverse && this.textAlign) $el.css('text-align', 'right');

			if(this.get('value')!='' || this.defaultValue!=''){
				// apply mask to the current value of the input or to the default value
				var val = this.format((this.get('value')!='')? this.get('value'): this.defaultValue);
				//setting defaultValue fixes the reset button from the form
				if (this.defaultValue != '') this.defaultValue = val;
				this.set('value', val);
			}

			// compatibility patch for infinite mask, that is now repeat
			if(this.type=='infinite') this.type = 'repeat';

			$el.data('mask', this);

			// removes the maxLength attribute (it will be set again if you use the unset method)
			$el.removeAttr(mlStr);

			// setting the input events
			$el.bind('keydown.mask', {func:this._onKeyDown, thisObj:this}, this._onMask)
				.bind('keypress.mask', {func:this._onKeyPress, thisObj:this}, this._onMask)
				.bind('keyup.mask', {func:this._onKeyUp, thisObj:this}, this._onMask)
				.bind('paste.mask', {func:this._onPaste, thisObj:this}, this._onMask)
				.bind('focus.mask', this._onFocus)
				.bind('blur.mask', this._onBlur)
				.bind('change.mask', this._onChange);
		}
	},

	//unsets the mask from el
	destroy : function(){
		this._super();
		var $el = this.$();

		if($el.data('mask')){
			var maxLength = $el.data('mask').maxLength;
			if(maxLength != -1) $el.attr('maxLength', maxLength);
			$el.unbind('.mask').removeData('mask');
		}
	},

	//masks a string
	format : function(str){
		this.init();
		if(typeof str != 'string') str = String(str);
		
		// insert signal if any
		if( (this.type=='reverse') && this.defaultValue ){
			if( typeof this.signals[this.defaultValue.charAt(0)] != 'undefined' ){
				var maybeASignal = str.charAt(0);
				this.signal = (typeof this.signals[maybeASignal] != 'undefined') ? this.signals[maybeASignal] : this.signals[this.defaultValue.charAt(0)];
				this.defaultValue = this.defaultValue.substring(1);
			}
		}

		return this.__maskArray(str.split(''),
					this.mask.replace(this.fixedCharsRegG, '').split(''),
					this.mask.split(''),
					this.type,
					this.maxLength,
					this.defaultValue,
					this.fixedCharsReg,
					this.signal);
	},

	// all the 3 events below are here just to fix the change event on reversed masks.
	// It isn't fired in cases that the keypress event returns false (needed).
	_onFocus: function(e){
		var $el = $(e.target), dataObj = $el.data('mask');
		dataObj.inputFocusValue = $el.val();
		dataObj.changed = false;
		if(dataObj.selectCharsOnFocus) $el.select();
	},

	_onBlur: function(e){
		var $this = $(e.target), dataObj = $this.data('mask');
		if(dataObj.inputFocusValue != $this.val() && !dataObj.changed)
			$this.trigger('change');
	},

	_onChange: function(e){
		$(e.target).data('mask').changed = true;
	},

	_onMask : function(e){
		var thisObj = e.data.thisObj,
			o = {};
		o._this = e.target;
		o.$this = $(o._this);
		// if the input is readonly it does nothing
		if(o.$this.attr('readonly')) return true;
		o.data = o.$this.data('mask');
		o[o.data.type] = true;
		o.value = o.$this.val();
		o.nKey = thisObj.__getKeyNumber(e);
		o.range = thisObj.__getRange(o._this);
		o.valueArray = o.value.split('');
		return e.data.func.call(thisObj, e, o);
	},

	_onKeyDown : function(e,o){
		// lets say keypress at desktop == keydown at iphone (theres no keypress at iphone)
		this.ignore = jQuery.inArray(o.nKey, this.get('ignoreKeys')) > -1 || e.ctrlKey || e.metaKey || e.altKey;
		if(this.ignore){
			var rep = this.get('keyRep')[o.nKey];
			o.data.onValid.call(o._this, rep? rep: '', o.nKey);
		}
		return this.isIphone() ? this._keyPress(e, o) : true;
	},

	_onKeyUp : function(e, o){
		//9=TAB_KEY 16=SHIFT_KEY
		//this is a little bug, when you go to an input with tab key
		//it would remove the range selected by default, and that's not a desired behavior
		if(o.nKey==9 || o.nKey==16) return true;

		if(o.data.type=='repeat'){
			return true;
		}
		
		return this._onPaste(e, o);
	},

	_onPaste : function(e,o){
		// changes the signal at the data obj from the input
		if(o.reverse) this.__changeSignal(e.type, o);
		
		//it needs for right click + paste to work property
		setTimeout(function()
		{
			o.value = o.$this.val();
			o.range = this.__getRange(o._this);
			o.valueArray = o.value.split('');
			var $thisVal = this.__maskArray(
				o.valueArray,
				o.data.maskNonFixedCharsArray,
				o.data.maskArray,
				o.data.type,
				o.data.maxLength,
				o.data.defaultValue,
				o.data.fixedCharsReg,
				o.data.signal
			);
			
			o.data.set('value', $thisVal );
			if( !o.reverse && o.data.defaultValue.length && (o.range.start==o.range.end) )
				this.__setRange(o._this, o.range.start, o.range.end);

			//fix so ie's and safari's caret won't go to the end of the input value.
			if( (jQuery.browser.msie || jQuery.browser.safari) && !o.reverse)
				this.__setRange(o._this,o.range.start,o.range.end);
		}.bind(this), 0);
		
		if(this.ignore) return true;

		// this makes the caret stay at first position when 
		// the user removes all values in an input and the plugin adds the default value to it (if it haves one).
		return true;
	},

	_onKeyPress: function(e, o){

		if(this.ignore) return true;

		// changes the signal at the data obj from the input
		if(o.reverse) this.__changeSignal(e.type, o);

		var c = String.fromCharCode(o.nKey),
			rangeStart = o.range.start,
			rawValue = o.value,
			maskArray = o.data.maskArray;

		if(o.reverse){
				// the input value from the range start to the value start
			var valueStart = rawValue.substr(0, rangeStart),
				// the input value from the range end to the value end
				valueEnd = rawValue.substr(o.range.end, rawValue.length);

			rawValue = valueStart+c+valueEnd;
			//necessary, if not decremented you will be able to input just the mask.length-1 if signal!=''
			//ex: mask:99,999.999.999 you will be able to input 99,999.999.99
			if(o.data.signal && (rangeStart-o.data.signal.length > 0)) rangeStart-=o.data.signal.length;
		}

		var valueArray = rawValue.replace(o.data.fixedCharsRegG, '').split(''),
			// searches for fixed chars begining from the range start position, till it finds a non fixed
			extraPos = this.__extraPositionsTill(rangeStart, maskArray, o.data.fixedCharsReg);

		o.rsEp = rangeStart+extraPos;

		if(o.repeat) o.rsEp = 0;

		// if the rule for this character doesnt exist (value.length is bigger than mask.length)
		// added a verification for maxLength in the case of the repeat type mask
		if( !this.get('rules')[maskArray[o.rsEp]] || (o.data.maxLength != -1 && valueArray.length >= o.data.maxLength && o.repeat)){
			// auto focus on the next input of the current form
			o.data.onOverflow.call(o._this, c, o.nKey);
			return false;
		}

		// if the new character is not obeying the law... :P
		else if( !this.get('rules')[maskArray[o.rsEp]].test( c ) ){
			o.data.onInvalid.call(o._this, c, o.nKey);
			return false;
		}

		else o.data.onValid.call(o._this, c, o.nKey);

		var $thisVal = this.__maskArray(
			valueArray,
			o.data.maskNonFixedCharsArray,
			maskArray,
			o.data.type,
			o.data.maxLength,
			o.data.defaultValue,
			o.data.fixedCharsReg,
			o.data.signal,
			extraPos
		);
		
		o.data.set('value', $thisVal);
		
		return (o.reverse)? this._keyPressReverse(e, o): (o.fixed)? this._keyPressFixed(e, o): true;
	},

	_keyPressFixed: function(e, o){

		if(o.range.start==o.range.end){
			// the 0 thing is cause theres a particular behavior i wasnt liking when you put a default
			// value on a fixed mask and you select the value from the input the range would go to the
			// end of the string when you enter a char. with this it will overwrite the first char wich is a better behavior.
			// opera fix, cant have range value bigger than value length, i think it loops thought the input value...
			if((o.rsEp==0 && o.value.length==0) || o.rsEp < o.value.length)
				this.__setRange(o._this, o.rsEp, o.rsEp+1);	
		}
		else
			this.__setRange(o._this, o.range.start, o.range.end);

		return true;
	},

	_keyPressReverse: function(e, o){
		//fix for ie
		//this bug was pointed by Pedro Martins
		//it fixes a strange behavior that ie was having after a char was inputted in a text input that
		//had its content selected by any range 
		if(jQuery.browser.msie && ((o.range.start==0 && o.range.end==0) || o.range.start != o.range.end ))
			this.__setRange(o._this, o.value.length);
		return false;
	},

	// changes the signal at the data obj from the input			
	__changeSignal : function(eventType,o){
		if(o.data.signal!==false){
			var inputChar = (eventType=='paste')? o.get('value').charAt(0): String.fromCharCode(o.nKey);
			if( this.signals && (typeof this.signals[inputChar] != 'undefined') ){
				o.data.signal = this.signals[inputChar];
			}
		}
	},

	__getKeyNumber : function(e){
		return (e.charCode||e.keyCode||e.which);
	},

	// this function is totaly specific to be used with this plugin, youll never need it
	// it gets the array representing an unmasked string and masks it depending on the type of the mask
	__maskArray : function(valueArray, maskNonFixedCharsArray, maskArray, type, maxlength, defaultValue, fixedCharsReg, signal, extraPos){
		if(type == 'reverse') valueArray.reverse();
		valueArray = this.__removeInvalidChars(valueArray, maskNonFixedCharsArray, type=='repeat'||type=='infinite');
		//if(defaultValue) valueArray = this.__applyDefaultValue.call(this, valueArray, defaultValue);
		valueArray = this.__applyMask(valueArray, maskArray, extraPos, fixedCharsReg);
		switch(type){
			case 'reverse':
				valueArray.reverse();
				return (signal || '')+valueArray.join('').substring(valueArray.length-maskArray.length);
			case 'infinite': case 'repeat':
				var joinedValue = valueArray.join('');
				return (maxlength != -1 && valueArray.length >= maxlength)? joinedValue.substring(0, maxlength): joinedValue;
			default:
				return valueArray.join('').substring(0, maskArray.length);
		}
		return '';
	},

	// Removes values that doesnt match the mask from the valueArray
	// Returns the array without the invalid chars.
	__removeInvalidChars : function(valueArray, maskNonFixedCharsArray, repeatType){
		// removes invalid chars
		for(var i=0, y=0; i<valueArray.length; i++ ){
			if( maskNonFixedCharsArray[y] &&
				this.get('rules')[maskNonFixedCharsArray[y]] &&
				!this.get('rules')[maskNonFixedCharsArray[y]].test(valueArray[i]) ){
					valueArray.splice(i,1);
					if(!repeatType) y--;
					i--;
			}
			if(!repeatType) y++;
		}
		return valueArray;
	},

	// Apply the current input mask to the valueArray and returns it. 
	__applyMask : function(valueArray, maskArray, plus, fixedCharsReg){
		if( typeof plus == 'undefined' ) plus = 0;
		// apply the current mask to the array of chars
		for(var i=0; i<valueArray.length+plus; i++ ){
			if( maskArray[i] && fixedCharsReg.test(maskArray[i]) )
				valueArray.splice(i, 0, maskArray[i]);
		}
		return valueArray;
	},

	// searches for fixed chars begining from the range start position, till it finds a non fixed
	__extraPositionsTill : function(rangeStart, maskArray, fixedCharsReg){
		var extraPos = 0;
		while(fixedCharsReg.test(maskArray[rangeStart++])){
			extraPos++;
		}
		return extraPos;
	},

	// http://www.bazon.net/mishoo/articles.epl?art_id=1292
	__setRange : function(input, start, end) {
		if(typeof end == 'undefined') end = start;
		if (input.setSelectionRange){
			input.setSelectionRange(start, end);
		}
		else{
			// assumed IE
			var range = input.createTextRange();
			range.collapse();
			range.moveStart('character', start);
			range.moveEnd('character', end - start);
			range.select();
		}
	},

	// adaptation from http://digitarald.de/project/autocompleter/
	__getRange : function(input){
		if (!jQuery.browser.msie) return {start: input.selectionStart, end: input.selectionEnd};
		var pos = {start: 0, end: 0},
			range = document.selection.createRange();
		pos.start = 0 - range.duplicate().moveStart('character', -100000);
		pos.end = pos.start + range.text.length;
		return pos;
	}

});