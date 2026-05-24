declare module "solarlunar" {
  export interface LunarDate {
    lunarYear: number;
    lunarMonth: number;
    lunarDay: number;
    isleap: boolean;
    solarYear: number;
    solarMonth: number;
    solarDay: number;
    lunarFestival?: string;
    solarFestival?: string;
    term?: string;
    animal?: string;
    ganzhiYear?: string;
    ganzhiMonth?: string;
    ganzhiDay?: string;
    festival?: string;
  }

  export function solar2lunar(
    year: number,
    month: number,
    day: number
  ): LunarDate;

  export function lunar2solar(
    year: number,
    month: number,
    day: number,
    isleap?: boolean
  ): LunarDate;
}
