/**
 * ===================================================================
 * 바이브 카페 주문서 JavaScript (script.js)
 * -------------------------------------------------------------------
 * - Supabase v2 클라이언트 초기화
 * - 실시간 예상 금액 계산 (calculateTotal 함수)
 * - 폼 입력값 유효성 검사 (이름, 음료 선택 여부)
 * - Supabase orders 테이블에 주문 데이터 INSERT 저장
 * - 주문 확인 메시지 표시 및 버튼 중복 클릭 방지
 * - 초기화(다시 작성) 기능
 * ===================================================================
 */

// -------------------------------------------------------------------
// 0. Supabase 설정 (URL 및 KEY 값을 직접 입력해주세요)
// -------------------------------------------------------------------
const SUPABASE_URL = 'https://twaljjawdgvbpaadvbdq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YWxqamF3ZGd2YnBhYWR2YmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzOTU5OTgsImV4cCI6MjEwNjk3MTk5OH0.IHj2v5lPKRss019neRavUre5acGVGH1kpl6L_OG4k2o';

// Supabase 클라이언트 객체 생성 (변수 이름: supabaseClient)
let supabaseClient;
try {
  // supabase CDN을 통해 로드된 전역 객체로부터 클라이언트를 생성합니다.
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.warn('Supabase 클라이언트 생성 대기 중 (SUPABASE_URL과 SUPABASE_KEY를 입력해주세요):', e);
}

// HTML 문서가 모두 준비되면 스크립트 실행
document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------------------------------------------
  // 1. 필요한 HTML 요소들을 변수에 저장 (DOM 탐색)
  // -----------------------------------------------------------------
  const orderForm = document.getElementById('order-form');               // 주문서 form 태그
  const nameInput = document.getElementById('name');                     // 이름 입력칸
  const phoneInput = document.getElementById('phone');                   // 전화번호 입력칸
  const beverageSelect = document.getElementById('beverage');           // 음료 선택 드롭다운
  const sizeRadios = document.querySelectorAll('input[name="size"]');    // 사이즈 라디오 버튼 목록
  const optionCheckboxes = document.querySelectorAll('input[name="options"]'); // 추가 옵션 체크박스 목록
  const quantityInput = document.getElementById('quantity');             // 수량 입력칸
  const requestsInput = document.getElementById('requests');             // 요청사항 textarea
  const estimatedPriceSpan = document.getElementById('estimated-price');// 예상 금액 숫자 표시 영역
  const submitBtn = document.getElementById('submit-btn');               // 주문하기 버튼
  const resetBtn = document.getElementById('reset-btn');                 // 다시 작성 버튼
  const orderConfirmation = document.getElementById('order-confirmation'); // 주문 확인 메시지 표시 영역

  // -----------------------------------------------------------------
  // 2. 예상 금액 계산 함수 (calculateTotal)
  //    - 음료, 사이즈, 옵션, 수량을 조합해 총 금액을 계산합니다.
  //    - 계산된 금액을 천 단위 콤마(toLocaleString)로 화면에 반영합니다.
  // -----------------------------------------------------------------
  function calculateTotal() {
    // 음료를 아직 선택하지 않은 경우 (기본 안내 옵션 선택 상태)
    if (!beverageSelect.value) {
      estimatedPriceSpan.textContent = '0';
      return 0;
    }

    // [음료 기본 가격] 선택된 <option>의 data-price 값 읽어오기
    const selectedBeverageOption = beverageSelect.options[beverageSelect.selectedIndex];
    const beveragePrice = Number(selectedBeverageOption.dataset.price) || 0;

    // [사이즈 추가 금액] 현재 체크된 라디오 버튼의 data-price 값 읽어오기
    const checkedSizeRadio = document.querySelector('input[name="size"]:checked');
    const sizePrice = checkedSizeRadio ? (Number(checkedSizeRadio.dataset.price) || 0) : 0;

    // [추가 옵션 금액] 체크된 모든 체크박스의 data-price 값을 합산
    let optionsPrice = 0;
    const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
    checkedOptions.forEach((checkbox) => {
      optionsPrice += Number(checkbox.dataset.price) || 0;
    });

    // [수량] 입력된 수량 숫자 변환 (비정상 값이면 기본 1로 처리)
    let quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }

    // 총 금액 계산: (음료 기본 가격 + 사이즈 추가금 + 옵션 합계) * 수량
    const totalPrice = (beveragePrice + sizePrice + optionsPrice) * quantity;

    // 천 단위 콤마를 적용해 화면의 예상 금액 영역에 표시 (예: 5,000)
    estimatedPriceSpan.textContent = totalPrice.toLocaleString();

    return totalPrice;
  }

  // -----------------------------------------------------------------
  // 3. 실시간 금액 변경 이벤트 연결
  //    - 음료, 사이즈, 추가 옵션, 수량이 바뀔 때마다 calculateTotal() 실행
  // -----------------------------------------------------------------

  // 음료 드롭다운 변경 시
  beverageSelect.addEventListener('change', calculateTotal);

  // 사이즈 라디오 버튼 변경 시
  sizeRadios.forEach((radio) => {
    radio.addEventListener('change', calculateTotal);
  });

  // 추가 옵션 체크박스 변경 시
  optionCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', calculateTotal);
  });

  // 수량 입력 변경 시 (숫자 타이핑 및 화살표 클릭 모두 감지)
  quantityInput.addEventListener('input', calculateTotal);
  quantityInput.addEventListener('change', calculateTotal);

  // -----------------------------------------------------------------
  // 4. 주문하기 버튼 클릭 시 (Supabase DB 저장 및 확인 메시지 표시)
  // -----------------------------------------------------------------
  orderForm.addEventListener('submit', async (event) => {
    // 폼 제출 시 페이지가 새로고침되는 기본 동작 방지
    event.preventDefault();

    // (1) 이름 유효성 검사: 공백을 제거한 후 비어있는지 확인
    const customerName = nameInput.value.trim();
    if (!customerName) {
      alert('이름을 입력해주세요');
      nameInput.focus();
      return;
    }

    // (2) 음료 선택 유효성 검사: 드롭다운 값이 선택되었는지 확인
    if (!beverageSelect.value) {
      alert('음료를 선택해주세요');
      beverageSelect.focus();
      return;
    }

    // (3) 주문 상세 정보 수집
    // 음료 기본 가격 및 음료명 추출 (예: "카페라떼 4,000원" -> 음료명: "카페라떼", 기본가격: 4000)
    const selectedBeverageOption = beverageSelect.options[beverageSelect.selectedIndex];
    const beveragePrice = Number(selectedBeverageOption.dataset.price) || 0;
    const beverageName = selectedBeverageOption.textContent.replace(/\s*[\d,]+원/, '').trim();

    // 사이즈 추출: "M" -> "M사이즈"
    const checkedSizeRadio = document.querySelector('input[name="size"]:checked');
    const sizeValue = checkedSizeRadio ? checkedSizeRadio.value : 'M';
    const sizeName = `${sizeValue}사이즈`;

    // 추가 옵션 배열 수집 (예: ['샷 추가', '크림 추가'])
    const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
    const selectedOptionNames = [];
    checkedOptions.forEach((checkbox) => {
      const label = document.querySelector(`label[for="${checkbox.id}"]`);
      if (label) {
        // 라벨에서 가격 표기 제거 (예: "샷 추가 (+500원)" -> "샷 추가")
        const cleanOptionName = label.textContent.replace(/\s*\([^)]*\)/, '').trim();
        selectedOptionNames.push(cleanOptionName);
      }
    });

    // 화면 메시지용 옵션 문구 (옵션이 있으면 "(샷 추가)", 없으면 빈 문자열)
    let optionsText = '';
    if (selectedOptionNames.length > 0) {
      optionsText = ` (${selectedOptionNames.join(', ')})`;
    }

    // 수량 가져오기
    let quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }

    // 최종 총 금액 계산
    const finalPrice = calculateTotal();
    const formattedPrice = finalPrice.toLocaleString();

    // (4) Supabase DB에 저장할 데이터 객체 구성
    // 지정된 열: customer_name, phone, drink, drink_price, size, options(배열), quantity, request, total_price
    const orderData = {
      customer_name: customerName,
      phone: phoneInput.value.trim() || null,
      drink: beverageName,
      drink_price: beveragePrice,
      size: sizeValue,
      options: selectedOptionNames,
      quantity: quantity,
      request: requestsInput.value.trim() || null,
      total_price: finalPrice
    };

    // (5) Supabase 설정 확인 안내
    if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      alert('script.js 파일 상단에 SUPABASE_URL과 SUPABASE_KEY를 먼저 입력해주세요!');
      console.error('Supabase 연결 정보가 설정되지 않았습니다.');
      return;
    }

    // (6) 저장하는 동안 버튼 비활성화 (두 번 눌리지 않게 중복 제출 방지)
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '주문 저장 중...';

    try {
      // Supabase orders 테이블에 데이터 삽입 (INSERT)
      const { data, error } = await supabaseClient
        .from('orders')
        .insert([orderData]);

      // 에러 발생 시 처리
      if (error) {
        console.error('주문 저장 실패 에러:', error);
        alert('주문 저장에 실패했어요');
        return;
      }

      // 저장 성공 시: 기존 주문 확인 메시지 표시
      const confirmationMessage = `${customerName}님, ${beverageName} ${sizeName}${optionsText} ${quantity}잔, 총 ${formattedPrice}원 주문이 접수되었습니다!`;
      orderConfirmation.textContent = confirmationMessage;
      orderConfirmation.hidden = false; // 숨김 해제

      // 메시지가 보이도록 화면 스크롤
      orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('네트워크/시스템 에러 발생:', err);
      alert('주문 저장에 실패했어요');
    } finally {
      // 요청이 끝나면 버튼 상태 원상 복구
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  // -----------------------------------------------------------------
  // 5. 다시 작성 버튼 클릭 (초기화)
  // -----------------------------------------------------------------
  resetBtn.addEventListener('click', (event) => {
    // 기본 reset 동작 방지 및 명시적 리셋 수행
    event.preventDefault();

    // 폼 입력값 리셋
    orderForm.reset();

    // 사이즈 기본값(M) 및 수량 기본값(1) 재설정
    const sizeMRadio = document.getElementById('size-m');
    if (sizeMRadio) {
      sizeMRadio.checked = true;
    }
    quantityInput.value = '1';

    // 금액 0원으로 재계산
    calculateTotal();

    // 주문 확인 메시지 숨김 및 초기화
    orderConfirmation.textContent = '';
    orderConfirmation.hidden = true;
  });

  // 페이지 처음 로드 시 초기 금액(0원) 계산 실행
  calculateTotal();
});
