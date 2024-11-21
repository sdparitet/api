/**
 * @param {number} id
 * @param {number} category
 * @param {number} position
 */
export class STAFF_PostBasicDto {
   constructor(model: STAFF_PostBasicDto) {
      this.id = model.id || -1
      this.category = model.category
      this.position = model.position
   }

   readonly id: number
   readonly category: number
   readonly position: number
}
/**
 * @param {number} id
 * @param {number} groupId
 * @param {string} name
 */
export class STAFF_EditPosDto {
   constructor(model: STAFF_EditPosDto) {
      this.id = model.id || -1
      this.groupId = model.groupId
      this.name = model.name
   }

   readonly id: number
   readonly groupId: number
   readonly name: string
}

/**
 * @param {number} id
 * @param {string} year
 * @param {number} category
 * @param {number} position
 * @param {number} month
 * @param {string} value
 */
export class STAFF_PostRequestDto extends STAFF_PostBasicDto {
   constructor(model: STAFF_PostRequestDto) {
      super(model)
      this.year = model.year
      this.month = model.month
      this.value = model.value
   }

   readonly year: number
   readonly month: number
   readonly value: string
}
