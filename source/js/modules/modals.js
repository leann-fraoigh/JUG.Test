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
