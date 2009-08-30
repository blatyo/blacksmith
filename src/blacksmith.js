/**
 * @author blatyo
 */
Object.extend(Array.prototype, {
	union: function(otherArray){
		if(!Object.isArray(otherArray)) return this;
        return this.without.apply(this, this.without.apply(this, otherArray));
	}
});

Object.extend(Event, (function(){
	var modifiers = ['ctrl', 'shift', 'alt'];
	var deshift = {'~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6',
	        '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{':'[', '}':']', 
			'|': '\\', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/'};
	
	var downShift = function(key){
		var key = String.fromCharCode(key);
		return (deshift[key] || key.toLowerCase()).charCodeAt(0);
	}
	
	var getKeyCode = function(event, shiftExpected){
		var key = event.which || event.keyCode;
		return event.shiftKey && shiftExpected ? downShift(key) : key;
	} 
	
	return {
		hasKeyEvent: function(event, keyCode, shiftExpected){
			event = event || window.event;
			return keyCode == getKeyCode(event, shiftExpected);
		},
		observeAll: function(element, handlers){
			$H(handlers).each(function(pair){
				Event.observe(element, pair.key, pair.value);
			});
		},
		stopObservingAll: function(element, handlers){
			$H(handlers).each(function(pair){
				Event.stopObserving(element, pair.key, pair.value);
			});
		},
		hotkey: function(element, keyCombination, callback, options){
			element = $(element);
			var keys = keyCombination.split('+');
			var mods = keys.union(modifiers);
			var key = keys.without.apply(keys, modifiers).reduce(); 
			var shiftExpected = mods.indexOf('shift') > -1;
			
			options = Object.extend({
				bubble: true,
				retval: true
			}, options || {});
			
			var handler = function(event){
				var triggered = Event.hasKeyEvent(event, Event['KEY_' + key.toUpperCase()])
				        || Event.hasKeyEvent(event, key.charCodeAt(0), shiftExpected);

				mods.each(function(mod){
					triggered = triggered && event[mod + 'Key'];
				});
				
				if(triggered) {
					callback(event);
					if(!options.bubble) event.stopPropagation();
					if(!options.retval) event.preventDefault();
				}
			}
			
			if(!element._hotkeys) element._hotkeys = {};
			element._hotkeys[keyCombination] = {
				options: options,
				handler: handler
			};
			
			element.observe('keypress', handler);
		},
		unHotkey: function(element, keyCombination){
			element = $(element);
			if(keyCombination){
				element.stopObserving('keypress', element._hotkeys[keyCombination].handler);
			} else {
				$H(element._hotkeys).values().each(function(hotkey){
					element.stopObserving('keypress', hotkey.handler);
				});
			}
		},
		lockKey: function(element, keyCombination, options){
			options = Object.extend({
				bubble: true,
				retval: false
			}, options || {});
			Event.hotkey(element, keyCombination, Prototype.emptyFunction, options);
		},
		unlockKey: function(element, keyCombination){
			Event.unHotkey(element, keyCombination);
		}
	}
})());

Element.addMethods({
	observeAll: Event.observeAll,
	stopObservingAll: Event.stopObservingAll,
	hotkey: Event.hotkey,
	unHotkey: Event.unHotkey,
	lockKey: Event.lockKey,
	unLockKey: Event.unLockKey
});

Object.extend(document, {
	observeAll: Event.observeAll.methodize(),
	stopObservingAll: Event.stopObservingAll.methodize(),
	hotkey: Event.hotkey.methodize(),
	unHotkey: Event.unHotkey.methodize(),
	lockKey: Event.lockKey.methodize(),
	unLockKey: Event.unLockKey.methodize()
});