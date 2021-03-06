/* eslint-disable */
(function () {
  // Polyfills

  // forEach
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
      thisArg = thisArg || window;
      for (let i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }

  // closest
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      let el = this;

      do {
        if (el.matches(s)) {
          return el;
        }
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }
})();

(function (global, factory) {
  if (typeof define === `function` && define.amd) {
    define([`exports`], factory);
  } else if (typeof exports !== `undefined`) {
    factory(exports);
  } else {
    let mod = {
      exports: {}
    };
    factory(mod.exports);
    window.bodyScrollLock = mod.exports;
  }
})(this, function (exports) {


  Object.defineProperty(exports, `__esModule`, {
    value: true
  });

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  // Older browsers don't support event options, feature detect it.

  // Adopted and modified solution from Bohdan Didukh (2017)
  // https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

  let hasPassiveEvents = false;
  if (typeof window !== `undefined`) {
    let passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return undefined;
      }
    };
    window.addEventListener(`testPassive`, null, passiveTestOptions);
    window.removeEventListener(`testPassive`, null, passiveTestOptions);
  }

  let isIosDevice = typeof window !== `undefined` && window.navigator && window.navigator.platform && /iP(ad|hone|od)/.test(window.navigator.platform);


  let locks = [];
  let documentListenerAdded = false;
  let initialClientY = -1;
  let previousBodyOverflowSetting = void 0;
  let previousBodyPaddingRight = void 0;

  // returns true if `el` should be allowed to receive touchmove events.
  let allowTouchMove = function allowTouchMove(el) {
    return locks.some(function (lock) {
      if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
        return true;
      }

      return false;
    });
  };

  let preventDefault = function preventDefault(rawEvent) {
    let e = rawEvent || window.event;

    // For the case whereby consumers adds a touchmove event listener to document.
    // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
    // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
    // the touchmove event on document will break.
    if (allowTouchMove(e.target)) {
      return true;
    }

    // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
    if (e.touches.length > 1) {
      return true;
    }

    if (e.preventDefault) {
      e.preventDefault();
    }

    return false;
  };

  let setOverflowHidden = function setOverflowHidden(options) {
    // Setting overflow on body/documentElement synchronously in Desktop Safari slows down
    // the responsiveness for some reason. Setting within a setTimeout fixes this.
    setTimeout(function () {
      // If previousBodyPaddingRight is already set, don't set it again.
      if (previousBodyPaddingRight === undefined) {
        let _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
        let scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

        if (_reserveScrollBarGap && scrollBarGap > 0) {
          previousBodyPaddingRight = document.body.style.paddingRight;
          document.body.style.paddingRight = scrollBarGap + `px`;
        }
      }

      // If previousBodyOverflowSetting is already set, don't set it again.
      if (previousBodyOverflowSetting === undefined) {
        previousBodyOverflowSetting = document.body.style.overflow;
        document.body.style.overflow = `hidden`;
      }
    });
  };

  let restoreOverflowSetting = function restoreOverflowSetting() {
    // Setting overflow on body/documentElement synchronously in Desktop Safari slows down
    // the responsiveness for some reason. Setting within a setTimeout fixes this.
    setTimeout(function () {
      if (previousBodyPaddingRight !== undefined) {
        document.body.style.paddingRight = previousBodyPaddingRight;

        // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
        // can be set again.
        previousBodyPaddingRight = undefined;
      }

      if (previousBodyOverflowSetting !== undefined) {
        document.body.style.overflow = previousBodyOverflowSetting;

        // Restore previousBodyOverflowSetting to undefined
        // so setOverflowHidden knows it can be set again.
        previousBodyOverflowSetting = undefined;
      }
    });
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
  let isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
    return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
  };

  let handleScroll = function handleScroll(event, targetElement) {
    let clientY = event.targetTouches[0].clientY - initialClientY;

    if (allowTouchMove(event.target)) {
      return false;
    }

    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      // element is at the top of its scroll.
      return preventDefault(event);
    }

    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      // element is at the top of its scroll.
      return preventDefault(event);
    }

    event.stopPropagation();
    return true;
  };

  let disableBodyScroll = exports.disableBodyScroll = function disableBodyScroll(targetElement, options) {
    if (isIosDevice) {
      // targetElement must be provided, and disableBodyScroll must not have been
      // called on this targetElement before.
      if (!targetElement) {
        // eslint-disable-next-line no-console
        console.error(`disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.`);
        return;
      }

      if (targetElement && !locks.some(function (lock) {
        return lock.targetElement === targetElement;
      })) {
        let lock = {
          targetElement,
          options: options || {}
        };

        locks = [].concat(_toConsumableArray(locks), [lock]);

        targetElement.ontouchstart = function (event) {
          if (event.targetTouches.length === 1) {
            // detect single touch.
            initialClientY = event.targetTouches[0].clientY;
          }
        };
        targetElement.ontouchmove = function (event) {
          if (event.targetTouches.length === 1) {
            // detect single touch.
            handleScroll(event, targetElement);
          }
        };

        if (!documentListenerAdded) {
          document.addEventListener(`touchmove`, preventDefault, hasPassiveEvents ? {passive: false} : undefined);
          documentListenerAdded = true;
        }
      }
    } else {
      setOverflowHidden(options);
      let _lock = {
        targetElement,
        options: options || {}
      };

      locks = [].concat(_toConsumableArray(locks), [_lock]);
    }
  };

  let clearAllBodyScrollLocks = exports.clearAllBodyScrollLocks = function clearAllBodyScrollLocks() {
    if (isIosDevice) {
      // Clear all locks ontouchstart/ontouchmove handlers, and the references.
      locks.forEach(function (lock) {
        lock.targetElement.ontouchstart = null;
        lock.targetElement.ontouchmove = null;
      });

      if (documentListenerAdded) {
        document.removeEventListener(`touchmove`, preventDefault, hasPassiveEvents ? {passive: false} : undefined);
        documentListenerAdded = false;
      }

      locks = [];

      // Reset initial clientY.
      initialClientY = -1;
    } else {
      restoreOverflowSetting();
      locks = [];
    }
  };

  let enableBodyScroll = exports.enableBodyScroll = function enableBodyScroll(targetElement) {
    if (isIosDevice) {
      if (!targetElement) {
        // eslint-disable-next-line no-console
        console.error(`enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.`);
        return;
      }

      targetElement.ontouchstart = null;
      targetElement.ontouchmove = null;

      locks = locks.filter(function (lock) {
        return lock.targetElement !== targetElement;
      });

      if (documentListenerAdded && locks.length === 0) {
        document.removeEventListener(`touchmove`, preventDefault, hasPassiveEvents ? {passive: false} : undefined);

        documentListenerAdded = false;
      }
    } else {
      locks = locks.filter(function (lock) {
        return lock.targetElement !== targetElement;
      });
      if (!locks.length) {
        restoreOverflowSetting();
      }
    }
  };
  window.disableBodyScroll = disableBodyScroll;
  window.enableBodyScroll = enableBodyScroll;
});


(function () {
  const form = document.querySelector(`.js-modal .form`);
  const btns = form.querySelectorAll(`.js-accept-btn, .js-decline-btn`);

  if (!form || btns.length < 1) {
    return;
  }

  function onclick(evt, btn) {
    evt.preventDefault();
    if (btn.closest(`.form__fieldset--inverted`)) {
      form.classList.add(`form--declined`);
    } else {
      form.classList.add(`form--accepted`);
    }

    setTimeout(() => {
      window.closeModal();
    }, 1100);

    setTimeout(() => {
      form.classList.remove(`form--declined`);
      form.classList.remove(`form--accepted`);
    }, 1400);
  }


  function addBtnsEventListener() {
    btns.forEach((btn) => {
      btn.addEventListener(`click`, (evt) => {
        onclick(evt, btn);
      });
    });
  }

  addBtnsEventListener();
})();

(function () {
  const ESC = 27;
  const modal = document.querySelector(`.js-modal`);
  const openBtns = document.querySelectorAll(`.js-open-modal`);
  const closeButtons = document.querySelectorAll(`.js-close-modal`);

  if (!openBtns || !modal || !closeButtons) {
    return;
  }

  function openModal() {
    modal.classList.add(`modal--active`);
    window.disableBodyScroll(modal);
  }

  function closeModal() {
    window.enableBodyScroll(modal);
    modal.classList.remove(`modal--active`);
  }

  function addOpenBtnsEventListener() {
    openBtns.forEach((btn) => {
      btn.addEventListener(`click`, function (evt) {
        evt.preventDefault();
        openModal();
      });
    });
  }

  function addWindowEventListener() {
    window.addEventListener(`keydown`, function (evt) {
      if (evt.keyCode === ESC) {
        if (modal.classList.contains(`modal--active`)) {
          evt.preventDefault();
          closeModal(evt);
        }
      }
    });
  }

  function addCloseBtnslEventListener() {
    closeButtons.forEach((btn) => {
      btn.addEventListener(`click`, function (evt) {
        closeModal(evt);
      });
    });
  }

  addOpenBtnsEventListener();
  addCloseBtnslEventListener();
  addWindowEventListener();

  window.closeModal = closeModal;
})();
