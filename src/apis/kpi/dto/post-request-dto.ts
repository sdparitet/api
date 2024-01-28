
/**
 * @param {number} id
 * @param {string} date
 * @param {number} product
 * @param {number} value
 */
export class KPI_PostRequestDto {
   constructor(model: KPI_PostRequestDto) {
      this.id = model.id || -1
      this.date = model.date
      this.product = model.product
      this.value = model.value
   }
   readonly id: number;
   readonly date: string;
   readonly product: number;
   readonly value: number;
}
