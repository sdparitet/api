
/**
 * @param {number} id
 * @param {string} date
 * @param {number} product
 * @param {number} value
 * @param {number} group_id
 */
export class KPIPostRequestDto {
   constructor(model: KPIPostRequestDto) {
      this.id = model.id
      this.date = model.date
      this.product = model.product
      this.value = model.value
      this.group_id = model.group_id
   }
   readonly id: number;
   readonly date: string;
   readonly product: number;
   readonly value: number;
   readonly group_id: number;
}
