"""
교육용 C 메모리 시뮬레이터
- GDB 없이 코드 분석 기반
- 교육적 설명 포함
- 가상 메모리 주소
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

@dataclass
class MemoryBlock:
    name: str
    address: str
    type: str
    size: int
    bytes: List[int]
    value: str
    points_to: Optional[str] = None
    explanation: str = ""  # 교육용 설명

@dataclass
class Step:
    line: int
    code: str
    stack: List[MemoryBlock]
    heap: List[MemoryBlock]
    explanation: str  # 이 스텝에서 무슨 일이 일어났는지 설명
    rsp: str = ""
    rbp: str = ""

class CSimulator:
    def __init__(self):
        self.stack_base = 0x7fffffffde00  # 가상 스택 시작 주소
        self.heap_base = 0x555555559000   # 가상 힙 시작 주소
        self.variables: Dict[str, Dict] = {}
        self.heap_blocks: Dict[str, Dict] = {}
        self.stack_offset = 0
        self.heap_offset = 0

    def simulate(self, code: str) -> Dict[str, Any]:
        """C 코드 시뮬레이션"""
        lines = code.strip().split('\n')
        steps = []

        # main 함수 찾기
        in_main = False
        main_start = 0

        for i, line in enumerate(lines):
            if 'int main' in line or 'void main' in line:
                in_main = True
                main_start = i
                continue

            if not in_main:
                continue

            stripped = line.strip()
            if not stripped or stripped == '{' or stripped == '}':
                continue

            if stripped.startswith('return'):
                steps.append(self._create_step(i + 1, stripped, "프로그램 종료"))
                break

            if stripped.startswith('//'):
                continue

            # 변수 선언 & 초기화 분석
            step = self._analyze_line(i + 1, stripped)
            if step:
                steps.append(step)

        return {
            "success": True,
            "steps": [asdict(s) for s in steps],
            "source_lines": lines,
            "message": ""
        }

    def _analyze_line(self, line_num: int, code: str) -> Optional[Step]:
        """한 줄 분석"""
        code = code.rstrip(';').strip()

        # int arr[5] = {1, 2, 3, 4, 5};
        arr_init = re.match(r'int\s+(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*\{([^}]+)\}', code)
        if arr_init:
            values = [int(v.strip()) for v in arr_init.group(3).split(',')]
            return self._handle_array_decl(line_num, code, arr_init.group(1), int(arr_init.group(2)), values)

        # int arr[5];
        arr_decl = re.match(r'int\s+(\w+)\s*\[\s*(\d+)\s*\]', code)
        if arr_decl:
            return self._handle_array_decl(line_num, code, arr_decl.group(1), int(arr_decl.group(2)), None)

        # arr[0] = 10;
        arr_assign = re.match(r'(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(-?\d+)', code)
        if arr_assign:
            return self._handle_array_assign(line_num, code, arr_assign.group(1), int(arr_assign.group(2)), int(arr_assign.group(3)))

        # int *p = (int *)malloc(sizeof(int) * 5);  또는 int *p = malloc(20);
        malloc_decl = re.match(r'int\s*\*\s*(\w+)\s*=\s*(?:\(int\s*\*\)\s*)?malloc\s*\((.+)\)', code)
        if malloc_decl:
            size_expr = malloc_decl.group(2)
            # sizeof(int) * n 파싱
            size_match = re.search(r'sizeof\s*\(\s*int\s*\)\s*\*\s*(\d+)', size_expr)
            if size_match:
                size = 4 * int(size_match.group(1))
            else:
                try:
                    size = int(size_expr)
                except:
                    size = 20
            return self._handle_malloc(line_num, code, malloc_decl.group(1), size)

        # free(p);
        free_call = re.match(r'free\s*\(\s*(\w+)\s*\)', code)
        if free_call:
            return self._handle_free(line_num, code, free_call.group(1))

        # int x = 5;
        int_decl = re.match(r'int\s+(\w+)\s*=\s*(-?\d+)', code)
        if int_decl:
            return self._handle_int_decl(line_num, code, int_decl.group(1), int(int_decl.group(2)))

        # int x;
        int_decl_only = re.match(r'int\s+(\w+)\s*$', code)
        if int_decl_only:
            return self._handle_int_decl(line_num, code, int_decl_only.group(1), None)

        # int *p = &x;
        ptr_decl = re.match(r'int\s*\*\s*(\w+)\s*=\s*&(\w+)', code)
        if ptr_decl:
            return self._handle_ptr_decl(line_num, code, ptr_decl.group(1), ptr_decl.group(2))

        # *p = value;
        ptr_assign = re.match(r'\*(\w+)\s*=\s*(-?\d+)', code)
        if ptr_assign:
            return self._handle_ptr_assign(line_num, code, ptr_assign.group(1), int(ptr_assign.group(2)))

        # p[i] = value; (포인터 배열 접근)
        ptr_idx_assign = re.match(r'(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(-?\d+)', code)
        if ptr_idx_assign:
            return self._handle_ptr_index_assign(line_num, code, ptr_idx_assign.group(1), int(ptr_idx_assign.group(2)), int(ptr_idx_assign.group(3)))

        # x = value;
        var_assign = re.match(r'(\w+)\s*=\s*(-?\d+)', code)
        if var_assign:
            return self._handle_var_assign(line_num, code, var_assign.group(1), int(var_assign.group(2)))

        # printf 등은 무시
        if 'printf' in code:
            return self._create_step(line_num, code, "printf: 변수 값을 화면에 출력")

        return None

    def _handle_array_decl(self, line_num: int, code: str, name: str, size: int, values: Optional[List[int]]) -> Step:
        """배열 선언 처리"""
        addr = self.stack_base - self.stack_offset
        total_size = 4 * size
        self.stack_offset += total_size

        if values:
            # 초기화된 배열
            bytes_list = []
            for v in values:
                bytes_list.extend(list(v.to_bytes(4, byteorder='little', signed=True)))
            # 부족하면 0으로 채움
            while len(bytes_list) < total_size:
                bytes_list.append(0)

            values_str = ', '.join(str(v) for v in values)
            explanation = f"""📚 배열 '{name}[{size}]' 선언 및 초기화

• 스택에 {total_size}바이트 연속 공간 할당 (int 4바이트 × {size}개)
• 시작 주소: {hex(addr)}
• 초기값: {{{values_str}}}

💡 배열은 연속된 메모리 공간!
   {name}[0] → {hex(addr)}
   {name}[1] → {hex(addr - 4)}
   {name}[2] → {hex(addr - 8)} ...

• 배열 이름 '{name}'은 첫 번째 요소의 주소 ({hex(addr)})"""
        else:
            bytes_list = [0] * total_size
            explanation = f"""📚 배열 '{name}[{size}]' 선언 (초기화 안됨)

• 스택에 {total_size}바이트 연속 공간 할당
• 시작 주소: {hex(addr)}
• 초기화 안됨 → 쓰레기값 포함!

⚠️ 배열도 초기화하지 않으면 예측 불가능한 값"""

        self.variables[name] = {
            "address": hex(addr),
            "type": f"int[{size}]",
            "size": total_size,
            "bytes": bytes_list,
            "value": f"[{size} elements]",
            "is_array": True,
            "array_size": size
        }

        return self._create_step(line_num, code, explanation)

    def _handle_array_assign(self, line_num: int, code: str, name: str, index: int, value: int) -> Step:
        """배열 요소 대입"""
        if name in self.variables and self.variables[name].get("is_array"):
            arr = self.variables[name]
            arr_size = arr.get("array_size", 0)
            base_addr = int(arr["address"], 16)
            elem_addr = base_addr - (index * 4)

            if 0 <= index < arr_size:
                # 바이트 업데이트
                offset = index * 4
                new_bytes = list(value.to_bytes(4, byteorder='little', signed=True))
                arr["bytes"][offset:offset+4] = new_bytes

                explanation = f"""✏️ 배열 요소 '{name}[{index}]' 값 변경

• {name}[{index}] = {value}
• 요소 주소: {hex(elem_addr)} (시작주소 - {index}×4)
• 새 값: {value}

💡 배열 인덱스 계산:
   주소 = 시작주소 + (인덱스 × 요소크기)
   {hex(elem_addr)} = {arr['address']} + ({index} × 4)"""
            else:
                explanation = f"""⚠️ 배열 범위 초과!

• {name}[{index}]에 접근 시도
• 배열 크기: {arr_size} (유효 인덱스: 0~{arr_size-1})
• 인덱스 {index}는 범위 밖!

❌ 버퍼 오버플로우 - 보안 취약점의 주요 원인"""
        else:
            explanation = f"배열 '{name}'을 찾을 수 없음"

        return self._create_step(line_num, code, explanation)

    def _handle_malloc(self, line_num: int, code: str, name: str, size: int) -> Step:
        """malloc 처리 - 힙 할당"""
        heap_addr = self.heap_base + self.heap_offset
        self.heap_offset += size + 16  # 메타데이터용 여유 공간

        # 포인터 변수는 스택에
        ptr_addr = self.stack_base - self.stack_offset
        self.stack_offset += 8

        bytes_list = list(heap_addr.to_bytes(8, byteorder='little'))
        num_elements = size // 4

        explanation = f"""🗄️ 동적 메모리 할당 (malloc)

• malloc({size}) 호출
• 힙(Heap)에 {size}바이트 공간 할당
• 할당된 주소: {hex(heap_addr)}

포인터 '{name}':
• 스택 주소: {hex(ptr_addr)}
• 저장된 값: {hex(heap_addr)} (힙 주소)

💡 스택 vs 힙:
   스택: 자동 할당/해제, 작은 크기
   힙: 수동 할당(malloc)/해제(free), 큰 크기 가능

⚠️ malloc 후에는 반드시 free()로 해제해야 메모리 누수 방지!"""

        self.variables[name] = {
            "address": hex(ptr_addr),
            "type": "int *",
            "size": 8,
            "bytes": bytes_list,
            "value": hex(heap_addr),
            "points_to": hex(heap_addr)
        }

        self.heap_blocks[name] = {
            "address": hex(heap_addr),
            "type": f"int[{num_elements}]",
            "size": size,
            "bytes": [0] * size,
            "value": f"[{num_elements} elements]",
            "is_heap": True
        }

        return self._create_step(line_num, code, explanation)

    def _handle_free(self, line_num: int, code: str, name: str) -> Step:
        """free 처리"""
        if name in self.variables and name in self.heap_blocks:
            heap_addr = self.variables[name]["points_to"]
            del self.heap_blocks[name]

            explanation = f"""🗑️ 동적 메모리 해제 (free)

• free({name}) 호출
• 힙 주소 {heap_addr}의 메모리 해제
• 운영체제에 메모리 반환

⚠️ free 후 주의사항:
• 포인터 {name}은 여전히 같은 주소를 가리킴 (댕글링 포인터!)
• free 후 {name} = NULL; 권장
• 같은 메모리 두 번 free 금지 (double free 취약점)"""

            # 포인터는 유지하되 dangling 표시
            self.variables[name]["value"] = "freed"
        else:
            explanation = f"'{name}'은 malloc으로 할당되지 않았거나 이미 해제됨"

        return self._create_step(line_num, code, explanation)

    def _handle_ptr_index_assign(self, line_num: int, code: str, name: str, index: int, value: int) -> Step:
        """포인터 인덱스 접근 (p[i] = value)"""
        if name in self.variables:
            ptr = self.variables[name]
            if name in self.heap_blocks:
                heap = self.heap_blocks[name]
                offset = index * 4
                if offset + 4 <= heap["size"]:
                    new_bytes = list(value.to_bytes(4, byteorder='little', signed=True))
                    heap["bytes"][offset:offset+4] = new_bytes

                    base_addr = int(ptr["points_to"], 16)
                    elem_addr = base_addr + offset

                    explanation = f"""✏️ 힙 메모리 접근: {name}[{index}] = {value}

• 포인터 {name}이 가리키는 힙 영역에 접근
• 요소 주소: {hex(elem_addr)}
• 계산: {ptr['points_to']} + ({index} × 4) = {hex(elem_addr)}
• 값 {value} 저장

💡 p[i]는 *(p + i)와 동일!
   포인터 산술: 주소 + (인덱스 × sizeof(타입))"""
                else:
                    explanation = f"⚠️ 힙 버퍼 오버플로우! 할당 범위 초과"
            else:
                explanation = f"'{name}'은 힙을 가리키지 않음"
        else:
            explanation = f"포인터 '{name}'을 찾을 수 없음"

        return self._create_step(line_num, code, explanation)

    def _handle_int_decl(self, line_num: int, code: str, name: str, value: Optional[int]) -> Step:
        """int 변수 선언 처리"""
        addr = self.stack_base - self.stack_offset
        self.stack_offset += 4

        if value is not None:
            bytes_list = list(value.to_bytes(4, byteorder='little', signed=True))
            explanation = f"""📦 정수 변수 '{name}' 선언 및 초기화

• 스택에 4바이트 공간 할당
• 주소: {hex(addr)}
• 값 {value}를 리틀 엔디안으로 저장
• 바이트 순서: {' '.join(f'{b:02X}' for b in bytes_list)} (역순!)

💡 리틀 엔디안: 작은 바이트가 앞에 옴
   5 = 0x00000005 → 메모리에 05 00 00 00으로 저장"""
        else:
            value = 0
            bytes_list = [0, 0, 0, 0]
            explanation = f"""📦 정수 변수 '{name}' 선언 (초기화 안됨)

• 스택에 4바이트 공간 할당
• 주소: {hex(addr)}
• 값이 초기화되지 않아 쓰레기값 포함!

⚠️ 초기화 안 된 변수는 예측 불가능한 값을 가짐"""

        self.variables[name] = {
            "address": hex(addr),
            "type": "int",
            "size": 4,
            "bytes": bytes_list,
            "value": str(value)
        }

        return self._create_step(line_num, code, explanation)

    def _handle_ptr_decl(self, line_num: int, code: str, ptr_name: str, target_name: str) -> Step:
        """포인터 선언 처리"""
        addr = self.stack_base - self.stack_offset
        self.stack_offset += 8  # 64비트 포인터

        if target_name in self.variables:
            target_addr = self.variables[target_name]["address"]
            target_addr_int = int(target_addr, 16)
            bytes_list = list(target_addr_int.to_bytes(8, byteorder='little'))

            explanation = f"""🔗 포인터 '{ptr_name}' 선언 - '{target_name}'의 주소 저장

• 포인터도 변수! 스택에 8바이트 공간 할당 (64비트 주소)
• 포인터 주소: {hex(addr)}
• 저장된 값: {target_addr} ('{target_name}'의 주소)

💡 포인터 = 다른 변수의 주소를 저장하는 변수
   {ptr_name} ──→ {target_name} ({self.variables[target_name]['value']})
                  ({target_addr})"""
        else:
            bytes_list = [0] * 8
            target_addr = "0x0"
            explanation = f"❌ 포인터가 존재하지 않는 변수를 가리킴"

        self.variables[ptr_name] = {
            "address": hex(addr),
            "type": "int *",
            "size": 8,
            "bytes": bytes_list,
            "value": target_addr,
            "points_to": target_addr
        }

        return self._create_step(line_num, code, explanation)

    def _handle_ptr_assign(self, line_num: int, code: str, ptr_name: str, value: int) -> Step:
        """포인터 역참조 대입 처리"""
        if ptr_name in self.variables:
            target_addr = self.variables[ptr_name].get("points_to")
            # 타겟 변수 찾기
            target_var = None
            for name, var in self.variables.items():
                if var["address"] == target_addr:
                    target_var = name
                    break

            if target_var:
                old_value = self.variables[target_var]["value"]
                bytes_list = list(value.to_bytes(4, byteorder='little', signed=True))
                self.variables[target_var]["value"] = str(value)
                self.variables[target_var]["bytes"] = bytes_list

                explanation = f"""✏️ 포인터를 통한 간접 수정!

• *{ptr_name} = {value}
• {ptr_name}이 가리키는 주소({target_addr})의 값을 수정
• 실제로 '{target_var}'의 값이 {old_value} → {value}로 변경됨!

💡 포인터 역참조(*): 포인터가 가리키는 메모리에 접근
   *{ptr_name}은 {ptr_name}이 가리키는 곳의 '값'"""

                return self._create_step(line_num, code, explanation)

        return self._create_step(line_num, code, "포인터 역참조")

    def _handle_var_assign(self, line_num: int, code: str, name: str, value: int) -> Step:
        """변수 대입 처리"""
        if name in self.variables:
            old_value = self.variables[name]["value"]
            bytes_list = list(value.to_bytes(4, byteorder='little', signed=True))
            self.variables[name]["value"] = str(value)
            self.variables[name]["bytes"] = bytes_list

            explanation = f"""✏️ 변수 '{name}' 값 변경

• {name} = {value}
• 기존 값 {old_value} → 새 값 {value}
• 메모리 주소 {self.variables[name]['address']}의 내용이 변경됨"""
        else:
            explanation = f"변수 '{name}'에 값 {value} 대입"

        return self._create_step(line_num, code, explanation)

    def _create_step(self, line_num: int, code: str, explanation: str) -> Step:
        """현재 상태로 Step 생성"""
        stack = []
        for name, var in self.variables.items():
            stack.append(MemoryBlock(
                name=name,
                address=var["address"],
                type=var["type"],
                size=var["size"],
                bytes=var["bytes"],
                value=var["value"],
                points_to=var.get("points_to"),
                explanation=""
            ))

        # 힙 블록들
        heap = []
        for name, block in self.heap_blocks.items():
            heap.append(MemoryBlock(
                name=f"*{name}",
                address=block["address"],
                type=block["type"],
                size=block["size"],
                bytes=block["bytes"],
                value=block["value"],
                points_to=None,
                explanation=""
            ))

        return Step(
            line=line_num,
            code=code,
            stack=stack,
            heap=heap,
            explanation=explanation,
            rsp=hex(self.stack_base - self.stack_offset),
            rbp=hex(self.stack_base)
        )


def simulate_code(code: str, timeout: int = 10) -> Dict[str, Any]:
    """외부 인터페이스"""
    try:
        sim = CSimulator()
        return sim.simulate(code)
    except Exception as e:
        return {
            "success": False,
            "error": "simulation_error",
            "message": str(e)
        }


# 테스트
if __name__ == "__main__":
    import json

    test_code = """#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int *p = &x;
    *p = 20;
    printf("%d\\n", x);
    return 0;
}"""

    result = simulate_code(test_code)
    print(json.dumps(result, indent=2, ensure_ascii=False))
