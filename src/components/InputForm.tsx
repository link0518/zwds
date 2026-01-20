import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Solar, Lunar } from 'lunar-javascript';
import type { InputFormProps, FormRawData, ShichenItem, Gender, CalendarType } from '../types';

const SHICHEN_MAPPING: ShichenItem[] = [
  { name: '早子时 (00:00 - 01:00)', value: 0 },
  { name: '丑时 (01:00 - 03:00)', value: 2 },
  { name: '寅时 (03:00 - 05:00)', value: 4 },
  { name: '卯时 (05:00 - 07:00)', value: 6 },
  { name: '辰时 (07:00 - 09:00)', value: 8 },
  { name: '巳时 (09:00 - 11:00)', value: 10 },
  { name: '午时 (11:00 - 13:00)', value: 12 },
  { name: '未时 (13:00 - 15:00)', value: 14 },
  { name: '申时 (15:00 - 17:00)', value: 16 },
  { name: '酉时 (17:00 - 19:00)', value: 18 },
  { name: '戌时 (19:00 - 21:00)', value: 20 },
  { name: '亥时 (21:00 - 23:00)', value: 22 },
  { name: '晚子时 (23:00 - 24:00)', value: 23 },
];

export default function InputForm({ onSubmit }: InputFormProps) {
  const [formData, setFormData] = useState<FormRawData>({
    name: '',
    gender: 'male',
    type: 'solar',
    year: '',
    month: '',
    day: '',
    hour: 0,
    fixLeap: false,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.year || !formData.month || !formData.day) return;

    const year = parseInt(formData.year, 10);
    const month = parseInt(formData.month, 10);
    const day = parseInt(formData.day, 10);

    const solarDate = formData.type === 'lunar'
      ? Lunar.fromYmd(year, month, day).getSolar()
      : Solar.fromYmd(year, month, day);

    const dateObj = new Date(
      solarDate.getYear(),
      solarDate.getMonth() - 1,
      solarDate.getDay(),
      formData.hour,
    );

    onSubmit({
      name: formData.name || '未命名',
      gender: formData.gender,
      solarDate: dateObj,
      raw: formData,
    });
  };

  const handleChange = <K extends keyof FormRawData>(field: K, value: FormRawData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-transparent">
      <h2 className="text-3xl font-bold mb-12 text-center text-lz-ink font-serif tracking-in-expand">
        出生信息
      </h2>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="relative group">
          <input
            type="text"
            className="input-field text-center font-serif text-lg py-3"
            value={formData.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange('name', event.target.value)}
            placeholder="请输入姓名"
          />
        </div>

        <div className="flex justify-center gap-16">
          {(['male', 'female'] as const).map((g) => (
            <label
              key={g}
              className="cursor-pointer transition-all duration-300 flex flex-col items-center gap-2 group"
            >
              <input
                type="radio"
                name="gender"
                className="hidden"
                checked={formData.gender === g}
                onChange={() => handleChange('gender', g as Gender)}
              />
              <span
                className={`font-serif text-xl tracking-widest ${formData.gender === g
                  ? 'text-lz-ink font-bold border-b-2 border-lz-red pb-1'
                  : 'text-lz-ink-light group-hover:text-lz-ink'
                  }`}
              >
                {g === 'male' ? '男' : '女'}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-center border-b border-lz-ink-lighter/20 pb-2">
          {(['solar', 'lunar'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleChange('type', type as CalendarType)}
              className={`px-6 py-1 font-serif tracking-widest transition-colors ${formData.type === type
                ? 'text-lz-red font-bold'
                : 'text-lz-ink-light hover:text-lz-ink'
                }`}
            >
              {type === 'solar' ? '阳历' : '阴历'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {(['year', 'month', 'day'] as const).map((field) => (
            <div key={field} className="flex flex-col items-center relative">
              <input
                type="number"
                className="input-field text-center font-serif text-xl w-full"
                value={formData[field]}
                onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange(field, event.target.value)}
                placeholder={field === 'year' ? '1990' : '1'}
                required
              />
              <span className="absolute -bottom-6 text-xs text-lz-ink-lighter font-serif">
                {field === 'year' ? '年' : field === 'month' ? '月' : '日'}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <div className="relative">
            <select
              value={formData.hour}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => handleChange('hour', parseInt(event.target.value, 10))}
              className="w-full bg-transparent border-b border-lz-ink-lighter py-2 text-center font-serif text-lg text-lz-ink focus:border-lz-red outline-none appearance-none cursor-pointer"
            >
              {SHICHEN_MAPPING.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-lz-ink-lighter">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-center">
          <button
            type="submit"
            className="btn-primary w-40 h-12 text-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-300"
          >
            排盘
          </button>
        </div>
      </form>
    </div>
  );
}
