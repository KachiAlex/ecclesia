export interface BibleVersion {
  id: string
  name: string
  abbreviation: string
  language: string
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'de4e12af7f28f599-02',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-01',
    name: 'New International Version',
    abbreviation: 'NIV',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-03',
    name: 'New American Standard Bible',
    abbreviation: 'NASB',
    language: 'en',
  },
  {
    id: '9879dbb7cfe39e4d-04',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-04',
    name: 'Amplified Bible',
    abbreviation: 'AMP',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-05',
    name: 'New King James Version',
    abbreviation: 'NKJV',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-06',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-17',
    name: 'The Message',
    abbreviation: 'MSG',
    language: 'en',
  },
  {
    id: 'de4e12af7f28f599-09',
    name: 'American Standard Version',
    abbreviation: 'ASV',
    language: 'en',
  },
  {
    id: 'bba9f40183526463-01',
    name: 'World English Bible',
    abbreviation: 'WEB',
    language: 'en',
  },
]

export const DEFAULT_BIBLE_VERSION = BIBLE_VERSIONS[0]
