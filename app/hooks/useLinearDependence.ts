import { FunctionCard } from '../types/game';
import { MathEngine } from '../lib/math-engine';

/**
 * 線形従属性チェックを行う非同期関数
 * フィールド上の関数カードが線形従属（重複）している場合、依存しているインデックスを返す
 */
export const resolveLinearDependence = async (field: FunctionCard[]): Promise<FunctionCard[]> => {
  if (field.length <= 1) return field;

  const expressions = field.map(c => c.expression);
  const { isDependent, dependentIndices } = await MathEngine.checkLinearDependence(expressions);

  if (isDependent && dependentIndices.length > 0) {
    console.log(`[LinearDependence] Removing duplicates at indices:`, dependentIndices);
    // インデックスが大きい方から削除すればズレない
    // dependentIndices は昇順とは限らないのでソート
    const sortedIndices = [...dependentIndices].sort((a, b) => b - a);
    
    const newField = [...field];
    for (const index of sortedIndices) {
      console.log(`[LinearDependence] Removing ${newField[index].name}`);
      newField.splice(index, 1);
    }
    return newField;
  }
  
  return field;
};
