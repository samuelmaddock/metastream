import React, { useCallback } from 'react'
import { locales, t, setLocale } from 'locale'
import { Dropdown } from './controls'
import { useDispatch, useSelector } from 'react-redux'
import { setSetting as setSettingAction } from 'actions/settings'
import { IAppState } from 'reducers'

interface Props {
  onChange?: () => void
}

export const LanguageSetting: React.SFC<Props> = props => {
  const dispatch = useDispatch()
  const setSetting = useCallback<typeof setSettingAction>(
    (...args) => dispatch(setSettingAction(...args)),
    [dispatch]
  )
  const settings = useSelector<IAppState, IAppState['settings']>(state => state.settings)

  return (
    <>
      <label htmlFor="appearance_language">{t('language')}</label>
      <Dropdown
        id="appearance_language"
        onChange={e => {
          const value = (e.target as HTMLSelectElement).value
          setSetting('language', value)
          setLocale(value)
          if (props.onChange) props.onChange()
        }}
      >
        {locales.map(locale => (
          <option
            key={locale.code}
            value={locale.code}
            selected={locale.code === settings.language}
          >
            {locale.label} {locale.flag}
          </option>
        ))}
      </Dropdown>
    </>
  )
}
