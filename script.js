/* ==========================================================================
   script.js (통합본)
   - 보안 모듈 로딩
   - 팝업/쿠키
   - ★로그인 세션 및 타이머 (신규)★
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 로그인 상태 체크 및 타이머 시작 ---
    checkLoginStatus();

    // --- 2. 보안 모듈 로딩 (메인 페이지용) ---
    const modal = document.getElementById('security-modal');
    if (modal) {
        const bar = document.getElementById('loading-bar');
        const text = document.getElementById('loading-text');
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                text.innerText = "보안 모듈 검증 완료.";
                setTimeout(() => { modal.style.display = 'none'; }, 800);
            } else {
                width += (Math.random() > 0.7 ? 0 : Math.floor(Math.random() * 5) + 1);
                if (width > 100) width = 100;
                bar.style.width = width + '%';
                if(width < 30) text.innerText = "AnySign4PC 모듈 로딩 중... (1/5)";
                else if(width < 60) text.innerText = "TouchEnKey 무결성 검증 중... (3/5)";
                else if(width < 90) text.innerText = "키보드 보안 드라이버 실행 중... (4/5)";
                else text.innerText = "사용자 환경 분석 중...";
            }
        }, 50);
    }

    // --- 3. 팝업 체크 (메인 페이지용) ---
    const popup1 = document.getElementById('main-popup');
    if(popup1 && !getCookie('kha_popup_done')) popup1.style.display = 'block';
    const popup2 = document.getElementById('popup-impersonation');
    if(popup2 && !getCookie('kha_popup_scam')) popup2.style.display = 'block';

    // --- 4. 기타 이벤트 바인딩 ---
    // HWP 다운로드 시늉 등 기존 코드 유지
    const hwpLinks = document.querySelectorAll('.board-list a, .file-link');
    hwpLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.includes('javascript')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if(link.innerText.includes('갱신') || link.innerText.includes('신청서')) {
                     alert('다운로드 중...\n[서식] 2026_상반기_갱신신청서(최종).hwp');
                } else {
                    alert('로그인이 필요한 서비스입니다.');
                }
            });
        }
    });
});

/* ==========================================================================
   로그인 & 세션 타이머 관련 로직
   ========================================================================== */

// 로그인 시도 (login.html 에서 호출)
function tryLogin() {
    const id = document.getElementById('userid').value;
    const pw = document.getElementById('userpw').value;

    if (!id || !pw) {
        alert("아이디와 비밀번호를 입력해주세요.");
        return;
    }

    // 아무거나 입력해도 성공
    // 로그인 만료 시간 설정 (현재시간 + 30분)
    const expireTime = new Date().getTime() + (30 * 60 * 1000);
    
    localStorage.setItem('kha_user', id);
    localStorage.setItem('kha_expire', expireTime);

    alert(`${id}님 환영합니다.\n[최근 접속: ${new Date().toLocaleString()}]`);
    location.href = 'index.html';
}

// 로그아웃
function logout() {
    localStorage.removeItem('kha_user');
    localStorage.removeItem('kha_expire');
    alert("로그아웃 되었습니다.");
    location.href = 'index.html'; // 혹은 location.reload();
}

/// 로그인 연장 (30분 리셋)
function extendSession() {
    const newExpire = new Date().getTime() + (30 * 60 * 1000);
    localStorage.setItem('kha_expire', newExpire);
    
    alert("로그인 시간이 30분 연장되었습니다.");
    
    // ★수정됨: 연장 즉시 화면 숫자를 30:00으로 바꿔줌 (반응 속도 UP)
    const timerSpan = document.getElementById('session-timer');
    if(timerSpan) {
        timerSpan.innerText = "30:00";
        timerSpan.style.color = "#1b499c"; // 혹시 빨간색이었으면 다시 파란색으로
    }
}

// 로그인 상태 체크 및 UI 변경
function checkLoginStatus() {
    const user = localStorage.getItem('kha_user');
    const utilLinks = document.querySelector('.util-links');

    if (!utilLinks) return;

    // 로그인 되어있으면 상단 바 교체
    if (user && localStorage.getItem('kha_expire')) {
        utilLinks.innerHTML = `
            <span class="user-info"><strong>${user}</strong> 님 (헌터)</span>
            <span class="timer-box">
                남은 시간 <span id="session-timer" class="time-text">--:--</span>
                <button class="btn-extend" onclick="extendSession()">연장</button>
            </span>
            <a href="#" onclick="logout()">로그아웃</a>
            <a href="#">정보수정</a>
            <a href="#">사이트맵</a>
        `;

        // 1초마다 타이머 갱신
        setInterval(() => {
            // ★핵심 수정: 매초마다 저장소(localStorage)에서 최신 만료 시간을 다시 가져옴!
            const currentExpire = localStorage.getItem('kha_expire'); 
            const now = new Date().getTime();
            const timeLeft = parseInt(currentExpire) - now;

            if (timeLeft <= 0) {
                logout(); // 시간 초과 시 로그아웃
            } else {
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                
                const timerSpan = document.getElementById('session-timer');
                if(timerSpan) {
                    timerSpan.innerText = 
                        (minutes < 10 ? "0" + minutes : minutes) + ":" + 
                        (seconds < 10 ? "0" + seconds : seconds);
                    
                    // 1분 미만 남으면 빨간색 경고
                    if (minutes === 0) timerSpan.style.color = 'red';
                    else timerSpan.style.color = '#1b499c';
                }
            }
        }, 1000);

    } else {
        // 비로그인 상태면 로그인 버튼 링크 연결
        const loginBtn = utilLinks.querySelector('a');
        if(loginBtn && loginBtn.innerText.includes('로그인')) {
            loginBtn.onclick = null;
            loginBtn.href = "login.html";
        }
    }
}

/* -----------------------------------------------------------
   기타 유틸리티 (쿠키, 팝업 닫기, 민원신고 등 기존 코드 유지)
   ----------------------------------------------------------- */
function setCookie(name, value, hours) { /* ...기존 코드... */ let expires = ""; if (hours) { const date = new Date(); date.setTime(date.getTime() + (hours * 60 * 60 * 1000)); expires = "; expires=" + date.toUTCString(); } document.cookie = name + "=" + (value || "") + expires + "; path=/"; }
function getCookie(name) { /* ...기존 코드... */ const nameEQ = name + "="; const ca = document.cookie.split(';'); for(let i=0;i < ca.length;i++) { let c = ca[i]; while (c.charAt(0)==' ') c = c.substring(1,c.length); if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length); } return null; }
function closePopup(id, isButton) { const popup = document.getElementById(id); let checkboxId = ''; let cookieName = ''; if (id === 'main-popup') { checkboxId = 'popup-check'; cookieName = 'kha_popup_done'; } else if (id === 'popup-impersonation') { checkboxId = 'check-impersonation'; cookieName = 'kha_popup_scam'; } const checkbox = document.getElementById(checkboxId); if (isButton && checkbox && checkbox.checked) { setCookie(cookieName, 'true', 24); } popup.style.display = 'none'; }
function submitMinwon() { const title = document.querySelector('.input-full').value; const content = document.querySelector('.input-area').value; const agree = document.getElementById('agreeCheck').checked; if (!title || !content) { alert('필수 입력 항목을 확인해주세요.'); return; } if (!agree) { alert('개인정보 수집 및 이용에 동의해야 합니다.'); return; } const confirmCert = confirm("민원 접수를 위해 '범용 공동인증서(구 공인인증서)' 전자서명이 필요합니다.\n인증서 선택 창을 띄우시겠습니까?"); if (confirmCert) { setTimeout(() => { alert("[오류] 인증서 모듈(Verasign.dll)을 찾을 수 없습니다.\n페이지를 새로고침(F5) 하거나 수동 설치해주십시오. (Error: 7701)"); }, 500); } }