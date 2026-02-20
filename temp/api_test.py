import urllib.request
import urllib.parse
import csv
import xml.etree.ElementTree as ET
import os

def get_api_key():
    """Reads the API key from .env.local in the root directory."""
    # Current script is in /temp/, so root is one level up
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(root_dir, '.env.local')
    
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('DATA_GO_KR_API_KEY='):
                        # Extract value after '=' and strip quotes/whitespace
                        return line.split('=', 1)[1].strip().strip('"').strip("'")
        except Exception as e:
            print(f"Error reading .env.local: {e}")
    return None

def fetch_data(api_key, lawd_cd, deal_ymd):
    """Fetches apartment transaction data from the Public Data Portal."""
    base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
    
    # 공공데이터포털은 인증키 인코딩에 매우 민감합니다.
    # 모든 파라미터를 urlencode로 한꺼번에 처리하여 + 문자 등을 안전하게 변환합니다.
    params = {
        'serviceKey': api_key,
        'LAWD_CD': lawd_cd,
        'DEAL_YMD': deal_ymd,
        'numOfRows': 100,
        'pageNo': 1
    }
    
    query_params = urllib.parse.urlencode(params)
    url = f"{base_url}?{query_params}"
    
    print(f"\n[Requesting Data]")
    # 보안을 위해 키의 앞부분 5자리만 출력하여 확인
    masked_key = api_key[:5] + "..." + api_key[-5:] if len(api_key) > 10 else "****"
    print(f"Using Key: {masked_key} (Length: {len(api_key)})")
    print(f"URL: {base_url}?serviceKey=********&{urllib.parse.urlencode({k:v for k,v in params.items() if k!='serviceKey'})}")
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"API Request Failed: {e}")
        return None

def parse_and_save_csv(xml_data, filename):
    """Parses XML response and saves it as a CSV file."""
    try:
        root = ET.fromstring(xml_data)
        
        # 헤더 체크 (성공 코드가 00, 0, 000 중 하나이면 정상)
        header = root.find('header')
        if header is not None:
            result_code = str(header.find('resultCode').text)
            result_msg = header.find('resultMsg').text
            if result_code not in ['00', '0', '000']:
                print(f"API Error: [{result_code}] {result_msg}")
                return

        items = root.findall('.//item')
        if not items:
            print(f"\n[알림] API 응답은 정상이지만, 해당 조건(지역/날짜)에 데이터가 없습니다.")
            return

        # 첫 번째 아이템에서 필드명 추출
        fieldnames = [child.tag for child in items[0]]
        
        # CSV 저장 (절대 경로로 생성)
        abs_filename = os.path.abspath(filename)
        with open(abs_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for item in items:
                row = {child.tag: child.text for child in item}
                writer.writerow(row)
        
        print(f"\n[Success]")
        print(f"파일이 성공적으로 저장되었습니다.")
        print(f"저장 경로: {abs_filename}")
        print(f"총 데이터 수: {len(items)}건")
        
    except Exception as e:
        print(f"Parsing/Saving Error: {e}")

if __name__ == "__main__":
    print("=== Apartment Trade API Test Tool ===")
    
    api_key = get_api_key()
    if not api_key:
        print("Error: DATA_GO_KR_API_KEY not found in .env.local")
        api_key = input("Please enter your API Key manually: ").strip()
        if not api_key:
            exit(1)
        
    lawd_cd = input("Enter LAWD_CD (5 digits, default 11110): ").strip() or "11110"
    deal_ymd = input("Enter DEAL_YMD (YYYYMM, default 202401): ").strip() or "202401"
    
    xml_raw = fetch_data(api_key, lawd_cd, deal_ymd)
    
    if xml_raw:
        # Save CSV in the same directory as the script
        current_dir = os.path.dirname(os.path.abspath(__file__))
        output_file = os.path.join(current_dir, f"result_{lawd_cd}_{deal_ymd}.csv")
        parse_and_save_csv(xml_raw, output_file)
