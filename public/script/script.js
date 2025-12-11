// 발자국 / 라이트워시
document.addEventListener("DOMContentLoaded", () => {
  const paws = Array.from(document.querySelectorAll(".paw"));
  const glow = document.querySelector(".lightwash");
  paws.forEach((el, i) => setTimeout(() => el.classList.add("is-on"), i * 120));
  if (glow) setTimeout(() => glow.classList.add("is-on"), 250);
});

// 로그인/회원가입 모달 + 보호링크
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("loginModal");
  const openBtn = document.getElementById("openLogin");
  const closeBtn = document.getElementById("closeModal");
  const protectedLinks = document.querySelectorAll("[data-protected]");
  const nextInput = document.getElementById("nextPath");
  const errorBox = document.getElementById("authError");

  const tabButtons = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".auth-pane");
  const goSignup = document.getElementById("goSignup");
  const goLogin = document.getElementById("goLogin");

  const setTab = (name) => {
    panes.forEach(p => p.style.display = (p.dataset.pane === name ? "block" : "none"));
    tabButtons.forEach(b => b.style.opacity = (b.dataset.tab === name ? "1" : ".6"));
    if (name === "login") {
      const idInput = document.getElementById("username");
      setTimeout(() => idInput && idInput.focus(), 0);
    } else {
      const idInput = document.getElementById("sg_username");
      setTimeout(() => idInput && idInput.focus(), 0);
    }
  };

  const openModal = (nextPath = "", initialTab = "login") => {
    if (!modal) return;
    modal.style.display = "flex";
    if (nextInput) nextInput.value = nextPath || "";
    if (errorBox && !errorBox.textContent) errorBox.style.display = "none";
    setTab(initialTab);
  };

  const closeModal = () => {
    if (modal) modal.style.display = "none";
  };

  // 보호 링크
  protectedLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const isLogin = document.body.dataset.isLogin === "true";
      if (!isLogin) {
        e.preventDefault();
        openModal(a.getAttribute("href"), "login");
      }
    });
  });

  // FAB로 열기
  if (openBtn) openBtn.addEventListener("click", () => openModal("", "login"));

  // 닫기
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // 탭 버튼
  tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));
  if (goSignup) goSignup.addEventListener("click", (e) => {
    e.preventDefault();
    setTab("signup");
  });
  if (goLogin) goLogin.addEventListener("click", (e) => {
    e.preventDefault();
    setTab("login");
  });

  // needLogin=1로 리다이렉트된 경우 자동 열기
  const needLogin = document.body.dataset.needLogin === "true";
  const isLogin = document.body.dataset.isLogin === "true";
  const nextPath = document.body.dataset.next || "";
  if (!isLogin && needLogin) openModal(nextPath, "login");
});