/**
 * 교육용 C 메모리 시뮬레이터
 * - GDB 없이 코드 분석 기반
 * - 교육적 설명 포함
 * - 가상 메모리 주소
 */

interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to: string | null;
  explanation: string;
}

interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string;
  rsp: string;
  rbp: string;
}

interface Variable {
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to?: string;
  is_array?: boolean;
  array_size?: number;
}

interface HeapBlock {
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  is_heap: boolean;
}

class CSimulator {
  private stackBase = 0x7fffffffde00;
  private heapBase = 0x555555559000;
  private variables: Map<string, Variable> = new Map();
  private heapBlocks: Map<string, HeapBlock> = new Map();
  private stackOffset = 0;
  private heapOffset = 0;

  simulate(code: string): { success: boolean; steps: Step[]; source_lines: string[]; message: string } {
    const lines = code.trim().split('\n');
    const steps: Step[] = [];
    let inMain = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('int main') || line.includes('void main')) {
        inMain = true;
        continue;
      }

      if (!inMain) continue;

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;

      if (stripped.startsWith('return')) {
        steps.push(this.createStep(i + 1, stripped, '프로그램 종료'));
        break;
      }

      if (stripped.startsWith('//')) continue;

      const step = this.analyzeLine(i + 1, stripped);
      if (step) steps.push(step);
    }

    return { success: true, steps, source_lines: lines, message: '' };
  }

  private analyzeLine(lineNum: number, code: string): Step | null {
    code = code.replace(/;$/, '').trim();

    // int arr[5] = {1, 2, 3, 4, 5};
    const arrInit = code.match(/^int\s+(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*\{([^}]+)\}/);
    if (arrInit) {
      const values = arrInit[3].split(',').map(v => parseInt(v.trim()));
      return this.handleArrayDecl(lineNum, code, arrInit[1], parseInt(arrInit[2]), values);
    }

    // int arr[5];
    const arrDecl = code.match(/^int\s+(\w+)\s*\[\s*(\d+)\s*\]/);
    if (arrDecl) {
      return this.handleArrayDecl(lineNum, code, arrDecl[1], parseInt(arrDecl[2]), null);
    }

    // arr[0] = 10;
    const arrAssign = code.match(/^(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(-?\d+)/);
    if (arrAssign) {
      return this.handleArrayAssign(lineNum, code, arrAssign[1], parseInt(arrAssign[2]), parseInt(arrAssign[3]));
    }

    // int *p = (int *)malloc(sizeof(int) * 5);
    const mallocDecl = code.match(/^int\s*\*\s*(\w+)\s*=\s*(?:\(int\s*\*\)\s*)?malloc\s*\((.+)\)/);
    if (mallocDecl) {
      const sizeExpr = mallocDecl[2];
      const sizeMatch = sizeExpr.match(/sizeof\s*\(\s*int\s*\)\s*\*\s*(\d+)/);
      let size: number;
      if (sizeMatch) {
        size = 4 * parseInt(sizeMatch[1]);
      } else {
        size = parseInt(sizeExpr) || 20;
      }
      return this.handleMalloc(lineNum, code, mallocDecl[1], size);
    }

    // free(p);
    const freeCall = code.match(/^free\s*\(\s*(\w+)\s*\)/);
    if (freeCall) {
      return this.handleFree(lineNum, code, freeCall[1]);
    }

    // int x = 5;
    const intDecl = code.match(/^int\s+(\w+)\s*=\s*(-?\d+)/);
    if (intDecl) {
      return this.handleIntDecl(lineNum, code, intDecl[1], parseInt(intDecl[2]));
    }

    // int x;
    const intDeclOnly = code.match(/^int\s+(\w+)\s*$/);
    if (intDeclOnly) {
      return this.handleIntDecl(lineNum, code, intDeclOnly[1], null);
    }

    // int *p = &x;
    const ptrDecl = code.match(/^int\s*\*\s*(\w+)\s*=\s*&(\w+)/);
    if (ptrDecl) {
      return this.handlePtrDecl(lineNum, code, ptrDecl[1], ptrDecl[2]);
    }

    // *p = value;
    const ptrAssign = code.match(/^\*(\w+)\s*=\s*(-?\d+)/);
    if (ptrAssign) {
      return this.handlePtrAssign(lineNum, code, ptrAssign[1], parseInt(ptrAssign[2]));
    }

    // p[i] = value;
    const ptrIdxAssign = code.match(/^(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(-?\d+)/);
    if (ptrIdxAssign) {
      return this.handlePtrIndexAssign(lineNum, code, ptrIdxAssign[1], parseInt(ptrIdxAssign[2]), parseInt(ptrIdxAssign[3]));
    }

    // x = value;
    const varAssign = code.match(/^(\w+)\s*=\s*(-?\d+)/);
    if (varAssign) {
      return this.handleVarAssign(lineNum, code, varAssign[1], parseInt(varAssign[2]));
    }

    // printf
    if (code.includes('printf')) {
      return this.createStep(lineNum, code, 'printf: 변수 값을 화면에 출력');
    }

    return null;
  }

  private handleArrayDecl(lineNum: number, code: string, name: string, size: number, values: number[] | null): Step {
    const addr = this.stackBase - this.stackOffset;
    const totalSize = 4 * size;
    this.stackOffset += totalSize;

    let bytesList: number[];
    let explanation: string;

    if (values) {
      bytesList = [];
      for (const v of values) {
        bytesList.push(...this.intToBytes(v, 4));
      }
      while (bytesList.length < totalSize) {
        bytesList.push(0);
      }

      const valuesStr = values.join(', ');
      explanation = `📚 배열 '${name}[${size}]' 선언 및 초기화

• 스택에 ${totalSize}바이트 연속 공간 할당 (int 4바이트 × ${size}개)
• 시작 주소: ${this.toHex(addr)}
• 초기값: {${valuesStr}}

💡 배열은 연속된 메모리 공간!
   ${name}[0] → ${this.toHex(addr)}
   ${name}[1] → ${this.toHex(addr - 4)}
   ${name}[2] → ${this.toHex(addr - 8)} ...

• 배열 이름 '${name}'은 첫 번째 요소의 주소 (${this.toHex(addr)})`;
    } else {
      bytesList = new Array(totalSize).fill(0);
      explanation = `📚 배열 '${name}[${size}]' 선언 (초기화 안됨)

• 스택에 ${totalSize}바이트 연속 공간 할당
• 시작 주소: ${this.toHex(addr)}
• 초기화 안됨 → 쓰레기값 포함!

⚠️ 배열도 초기화하지 않으면 예측 불가능한 값`;
    }

    this.variables.set(name, {
      address: this.toHex(addr),
      type: `int[${size}]`,
      size: totalSize,
      bytes: bytesList,
      value: `[${size} elements]`,
      is_array: true,
      array_size: size
    });

    return this.createStep(lineNum, code, explanation);
  }

  private handleArrayAssign(lineNum: number, code: string, name: string, index: number, value: number): Step {
    const arr = this.variables.get(name);
    if (arr?.is_array) {
      const arrSize = arr.array_size || 0;
      const baseAddr = parseInt(arr.address, 16);
      const elemAddr = baseAddr - (index * 4);

      let explanation: string;
      if (index >= 0 && index < arrSize) {
        const offset = index * 4;
        const newBytes = this.intToBytes(value, 4);
        arr.bytes.splice(offset, 4, ...newBytes);

        explanation = `✏️ 배열 요소 '${name}[${index}]' 값 변경

• ${name}[${index}] = ${value}
• 요소 주소: ${this.toHex(elemAddr)} (시작주소 - ${index}×4)
• 새 값: ${value}

💡 배열 인덱스 계산:
   주소 = 시작주소 + (인덱스 × 요소크기)
   ${this.toHex(elemAddr)} = ${arr.address} + (${index} × 4)`;
      } else {
        explanation = `⚠️ 배열 범위 초과!

• ${name}[${index}]에 접근 시도
• 배열 크기: ${arrSize} (유효 인덱스: 0~${arrSize - 1})
• 인덱스 ${index}는 범위 밖!

❌ 버퍼 오버플로우 - 보안 취약점의 주요 원인`;
      }
      return this.createStep(lineNum, code, explanation);
    }

    return this.createStep(lineNum, code, `배열 '${name}'을 찾을 수 없음`);
  }

  private handleMalloc(lineNum: number, code: string, name: string, size: number): Step {
    const heapAddr = this.heapBase + this.heapOffset;
    this.heapOffset += size + 16;

    const ptrAddr = this.stackBase - this.stackOffset;
    this.stackOffset += 8;

    const bytesList = this.intToBytes(heapAddr, 8);
    const numElements = Math.floor(size / 4);

    const explanation = `🗄️ 동적 메모리 할당 (malloc)

• malloc(${size}) 호출
• 힙(Heap)에 ${size}바이트 공간 할당
• 할당된 주소: ${this.toHex(heapAddr)}

포인터 '${name}':
• 스택 주소: ${this.toHex(ptrAddr)}
• 저장된 값: ${this.toHex(heapAddr)} (힙 주소)

💡 스택 vs 힙:
   스택: 자동 할당/해제, 작은 크기
   힙: 수동 할당(malloc)/해제(free), 큰 크기 가능

⚠️ malloc 후에는 반드시 free()로 해제해야 메모리 누수 방지!`;

    this.variables.set(name, {
      address: this.toHex(ptrAddr),
      type: 'int *',
      size: 8,
      bytes: bytesList,
      value: this.toHex(heapAddr),
      points_to: this.toHex(heapAddr)
    });

    this.heapBlocks.set(name, {
      address: this.toHex(heapAddr),
      type: `int[${numElements}]`,
      size: size,
      bytes: new Array(size).fill(0),
      value: `[${numElements} elements]`,
      is_heap: true
    });

    return this.createStep(lineNum, code, explanation);
  }

  private handleFree(lineNum: number, code: string, name: string): Step {
    const ptr = this.variables.get(name);
    const heap = this.heapBlocks.get(name);

    if (ptr && heap) {
      const heapAddr = ptr.points_to;
      this.heapBlocks.delete(name);

      const explanation = `🗑️ 동적 메모리 해제 (free)

• free(${name}) 호출
• 힙 주소 ${heapAddr}의 메모리 해제
• 운영체제에 메모리 반환

⚠️ free 후 주의사항:
• 포인터 ${name}은 여전히 같은 주소를 가리킴 (댕글링 포인터!)
• free 후 ${name} = NULL; 권장
• 같은 메모리 두 번 free 금지 (double free 취약점)`;

      ptr.value = 'freed';
      return this.createStep(lineNum, code, explanation);
    }

    return this.createStep(lineNum, code, `'${name}'은 malloc으로 할당되지 않았거나 이미 해제됨`);
  }

  private handlePtrIndexAssign(lineNum: number, code: string, name: string, index: number, value: number): Step {
    const ptr = this.variables.get(name);
    const heap = this.heapBlocks.get(name);

    if (ptr && heap) {
      const offset = index * 4;
      if (offset + 4 <= heap.size) {
        const newBytes = this.intToBytes(value, 4);
        heap.bytes.splice(offset, 4, ...newBytes);

        const baseAddr = parseInt(ptr.points_to!, 16);
        const elemAddr = baseAddr + offset;

        const explanation = `✏️ 힙 메모리 접근: ${name}[${index}] = ${value}

• 포인터 ${name}이 가리키는 힙 영역에 접근
• 요소 주소: ${this.toHex(elemAddr)}
• 계산: ${ptr.points_to} + (${index} × 4) = ${this.toHex(elemAddr)}
• 값 ${value} 저장

💡 p[i]는 *(p + i)와 동일!
   포인터 산술: 주소 + (인덱스 × sizeof(타입))`;

        return this.createStep(lineNum, code, explanation);
      }
      return this.createStep(lineNum, code, '⚠️ 힙 버퍼 오버플로우! 할당 범위 초과');
    }

    if (ptr) {
      return this.createStep(lineNum, code, `'${name}'은 힙을 가리키지 않음`);
    }

    return this.createStep(lineNum, code, `포인터 '${name}'을 찾을 수 없음`);
  }

  private handleIntDecl(lineNum: number, code: string, name: string, value: number | null): Step {
    const addr = this.stackBase - this.stackOffset;
    this.stackOffset += 4;

    let bytesList: number[];
    let explanation: string;

    if (value !== null) {
      bytesList = this.intToBytes(value, 4);
      const bytesHex = bytesList.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

      explanation = `📦 정수 변수 '${name}' 선언 및 초기화

• 스택에 4바이트 공간 할당
• 주소: ${this.toHex(addr)}
• 값 ${value}를 리틀 엔디안으로 저장
• 바이트 순서: ${bytesHex} (역순!)

💡 리틀 엔디안: 작은 바이트가 앞에 옴
   5 = 0x00000005 → 메모리에 05 00 00 00으로 저장`;
    } else {
      value = 0;
      bytesList = [0, 0, 0, 0];
      explanation = `📦 정수 변수 '${name}' 선언 (초기화 안됨)

• 스택에 4바이트 공간 할당
• 주소: ${this.toHex(addr)}
• 값이 초기화되지 않아 쓰레기값 포함!

⚠️ 초기화 안 된 변수는 예측 불가능한 값을 가짐`;
    }

    this.variables.set(name, {
      address: this.toHex(addr),
      type: 'int',
      size: 4,
      bytes: bytesList,
      value: String(value)
    });

    return this.createStep(lineNum, code, explanation);
  }

  private handlePtrDecl(lineNum: number, code: string, ptrName: string, targetName: string): Step {
    const addr = this.stackBase - this.stackOffset;
    this.stackOffset += 8;

    const target = this.variables.get(targetName);

    if (target) {
      const targetAddrInt = parseInt(target.address, 16);
      const bytesList = this.intToBytes(targetAddrInt, 8);

      const explanation = `🔗 포인터 '${ptrName}' 선언 - '${targetName}'의 주소 저장

• 포인터도 변수! 스택에 8바이트 공간 할당 (64비트 주소)
• 포인터 주소: ${this.toHex(addr)}
• 저장된 값: ${target.address} ('${targetName}'의 주소)

💡 포인터 = 다른 변수의 주소를 저장하는 변수
   ${ptrName} ──→ ${targetName} (${target.value})
                  (${target.address})`;

      this.variables.set(ptrName, {
        address: this.toHex(addr),
        type: 'int *',
        size: 8,
        bytes: bytesList,
        value: target.address,
        points_to: target.address
      });

      return this.createStep(lineNum, code, explanation);
    }

    this.variables.set(ptrName, {
      address: this.toHex(addr),
      type: 'int *',
      size: 8,
      bytes: new Array(8).fill(0),
      value: '0x0',
      points_to: '0x0'
    });

    return this.createStep(lineNum, code, '❌ 포인터가 존재하지 않는 변수를 가리킴');
  }

  private handlePtrAssign(lineNum: number, code: string, ptrName: string, value: number): Step {
    const ptr = this.variables.get(ptrName);

    if (ptr?.points_to) {
      let targetVar: string | null = null;

      for (const [name, v] of this.variables) {
        if (v.address === ptr.points_to) {
          targetVar = name;
          break;
        }
      }

      if (targetVar) {
        const target = this.variables.get(targetVar)!;
        const oldValue = target.value;
        target.value = String(value);
        target.bytes = this.intToBytes(value, 4);

        const explanation = `✏️ 포인터를 통한 간접 수정!

• *${ptrName} = ${value}
• ${ptrName}이 가리키는 주소(${ptr.points_to})의 값을 수정
• 실제로 '${targetVar}'의 값이 ${oldValue} → ${value}로 변경됨!

💡 포인터 역참조(*): 포인터가 가리키는 메모리에 접근
   *${ptrName}은 ${ptrName}이 가리키는 곳의 '값'`;

        return this.createStep(lineNum, code, explanation);
      }
    }

    return this.createStep(lineNum, code, '포인터 역참조');
  }

  private handleVarAssign(lineNum: number, code: string, name: string, value: number): Step {
    const v = this.variables.get(name);

    if (v) {
      const oldValue = v.value;
      v.value = String(value);
      v.bytes = this.intToBytes(value, 4);

      const explanation = `✏️ 변수 '${name}' 값 변경

• ${name} = ${value}
• 기존 값 ${oldValue} → 새 값 ${value}
• 메모리 주소 ${v.address}의 내용이 변경됨`;

      return this.createStep(lineNum, code, explanation);
    }

    return this.createStep(lineNum, code, `변수 '${name}'에 값 ${value} 대입`);
  }

  private createStep(lineNum: number, code: string, explanation: string): Step {
    const stack: MemoryBlock[] = [];
    for (const [name, v] of this.variables) {
      stack.push({
        name,
        address: v.address,
        type: v.type,
        size: v.size,
        bytes: v.bytes,
        value: v.value,
        points_to: v.points_to || null,
        explanation: ''
      });
    }

    const heap: MemoryBlock[] = [];
    for (const [name, block] of this.heapBlocks) {
      heap.push({
        name: `*${name}`,
        address: block.address,
        type: block.type,
        size: block.size,
        bytes: block.bytes,
        value: block.value,
        points_to: null,
        explanation: ''
      });
    }

    return {
      line: lineNum,
      code,
      stack,
      heap,
      explanation,
      rsp: this.toHex(this.stackBase - this.stackOffset),
      rbp: this.toHex(this.stackBase)
    };
  }

  private intToBytes(value: number, size: number): number[] {
    const bytes: number[] = [];
    // Handle negative numbers with two's complement
    if (value < 0) {
      value = value >>> 0; // Convert to unsigned 32-bit
    }
    for (let i = 0; i < size; i++) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  private toHex(n: number): string {
    return '0x' + n.toString(16);
  }
}

export function simulateCode(code: string): { success: boolean; steps: Step[]; source_lines: string[]; error?: string; message?: string } {
  try {
    const sim = new CSimulator();
    return sim.simulate(code);
  } catch (e: any) {
    return {
      success: false,
      steps: [],
      source_lines: [],
      error: 'simulation_error',
      message: e.message
    };
  }
}
