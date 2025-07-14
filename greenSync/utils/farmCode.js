// 팜코드 생성 유틸리티 (영어+숫자 조합, 6-8자)
class FarmCode {
    static createFarmCode() {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      
      // 6-8자 랜덤 길이 결정
      const totalLength = Math.floor(Math.random() * 3) + 6; // 6, 7, 8
      
      // 최소 영어 2자, 숫자 2자 보장
      const minLetters = 2;
      const minNumbers = 2;
      const remainingLength = totalLength - minLetters - minNumbers;
      
      // 나머지 길이를 영어/숫자에 랜덤 배분
      const additionalLetters = Math.floor(Math.random() * (remainingLength + 1));
      const additionalNumbers = remainingLength - additionalLetters;
      
      const letterCount = minLetters + additionalLetters;
      const numberCount = minNumbers + additionalNumbers;
      
      let code = '';
      
      // 영어 문자 추가
      for (let i = 0; i < letterCount; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      
      // 숫자 추가
      for (let i = 0; i < numberCount; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      
      // 문자열 섞기
      return code.split('').sort(() => Math.random() - 0.5).join('');
    }
    
    // 팜코드 유효성 검사
    static validateFarmCode(code) {
      if (!code || typeof code !== 'string') return false;
      if (code.length < 6 || code.length > 8) return false;
      
      const hasLetter = /[A-Z]/.test(code);
      const hasNumber = /[0-9]/.test(code);
      const onlyValidChars = /^[A-Z0-9]+$/.test(code);
      
      return hasLetter && hasNumber && onlyValidChars;
    }
  }
  
  export default FarmCode;