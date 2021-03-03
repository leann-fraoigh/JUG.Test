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
