export interface DailyVerseEntry {
  dayOfYear: number
  reference: string
  passageId: string
  theme: string
}

export const DAILY_VERSES: DailyVerseEntry[] = [
  { dayOfYear: 1, reference: 'Genesis 1:1-3', passageId: 'GEN.1.1-GEN.1.3', theme: 'Creation & Beginnings' },
  { dayOfYear: 2, reference: 'Psalm 23:1-4', passageId: 'PSA.23.1-PSA.23.4', theme: 'Shepherding' },
  { dayOfYear: 3, reference: 'Proverbs 3:5-6', passageId: 'PRO.3.5-PRO.3.6', theme: 'Trust' },
  { dayOfYear: 4, reference: 'Isaiah 40:28-31', passageId: 'ISA.40.28-ISA.40.31', theme: 'Strength' },
  { dayOfYear: 5, reference: 'Jeremiah 29:11', passageId: 'JER.29.11', theme: 'Hope' },
  { dayOfYear: 6, reference: 'Matthew 5:14-16', passageId: 'MAT.5.14-MAT.5.16', theme: 'Light' },
  { dayOfYear: 7, reference: 'Matthew 11:28-30', passageId: 'MAT.11.28-MAT.11.30', theme: 'Rest' },
  { dayOfYear: 8, reference: 'John 1:1-5', passageId: 'JHN.1.1-JHN.1.5', theme: 'Word Made Flesh' },
  { dayOfYear: 9, reference: 'John 3:16-17', passageId: 'JHN.3.16-JHN.3.17', theme: 'Salvation' },
  { dayOfYear: 10, reference: 'John 15:4-5', passageId: 'JHN.15.4-JHN.15.5', theme: 'Abiding' },
  { dayOfYear: 11, reference: 'Romans 8:28-31', passageId: 'ROM.8.28-ROM.8.31', theme: 'Purpose' },
  { dayOfYear: 12, reference: 'Romans 12:1-2', passageId: 'ROM.12.1-ROM.12.2', theme: 'Renewal' },
  { dayOfYear: 13, reference: '1 Corinthians 13:4-7', passageId: '1CO.13.4-1CO.13.7', theme: 'Love' },
  { dayOfYear: 14, reference: '2 Corinthians 5:17-20', passageId: '2CO.5.17-2CO.5.20', theme: 'New Creation' },
  { dayOfYear: 15, reference: 'Galatians 5:22-25', passageId: 'GAL.5.22-GAL.5.25', theme: 'Fruit of the Spirit' },
  { dayOfYear: 16, reference: 'Ephesians 2:8-10', passageId: 'EPH.2.8-EPH.2.10', theme: 'Grace' },
  { dayOfYear: 17, reference: 'Philippians 4:4-7', passageId: 'PHP.4.4-PHP.4.7', theme: 'Peace' },
  { dayOfYear: 18, reference: 'Colossians 3:12-15', passageId: 'COL.3.12-COL.3.15', theme: 'Unity' },
  { dayOfYear: 19, reference: '1 Thessalonians 5:16-18', passageId: '1TH.5.16-1TH.5.18', theme: 'Gratitude' },
  { dayOfYear: 20, reference: '2 Timothy 1:6-7', passageId: '2TI.1.6-2TI.1.7', theme: 'Courage' },
  { dayOfYear: 21, reference: 'Hebrews 4:12-16', passageId: 'HEB.4.12-HEB.4.16', theme: 'Living Word' },
  { dayOfYear: 22, reference: 'Hebrews 12:1-3', passageId: 'HEB.12.1-HEB.12.3', theme: 'Endurance' },
  { dayOfYear: 23, reference: 'James 1:2-5', passageId: 'JAS.1.2-JAS.1.5', theme: 'Wisdom' },
  { dayOfYear: 24, reference: '1 Peter 5:6-10', passageId: '1PE.5.6-1PE.5.10', theme: 'Humility' },
  { dayOfYear: 25, reference: '1 John 4:7-12', passageId: '1JN.4.7-1JN.4.12', theme: 'Perfect Love' },
  { dayOfYear: 26, reference: 'Revelation 21:3-5', passageId: 'REV.21.3-REV.21.5', theme: 'New Creation' },
  { dayOfYear: 27, reference: 'Psalm 27:1-4', passageId: 'PSA.27.1-PSA.27.4', theme: 'Confidence' },
  { dayOfYear: 28, reference: 'Psalm 91:1-4', passageId: 'PSA.91.1-PSA.91.4', theme: 'Protection' },
  { dayOfYear: 29, reference: 'Psalm 121:1-4', passageId: 'PSA.121.1-PSA.121.4', theme: 'Help' },
  { dayOfYear: 30, reference: 'Isaiah 43:1-3', passageId: 'ISA.43.1-ISA.43.3', theme: 'Redemption' },
  { dayOfYear: 31, reference: 'Lamentations 3:22-24', passageId: 'LAM.3.22-LAM.3.24', theme: 'Faithfulness' },
]

export function getDailyVerseEntry(date: Date = new Date()): DailyVerseEntry {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  const entry = DAILY_VERSES[dayOfYear % DAILY_VERSES.length]
  return entry
}
