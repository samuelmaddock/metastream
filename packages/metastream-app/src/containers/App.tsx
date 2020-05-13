import React, { SFC, useEffect } from 'react'
import { UpdateService } from '../services/updater'
import { useDispatch } from 'react-redux'
import { setUpdateState } from '../actions/ui'

const App: SFC = props => {
  const dispatch = useDispatch()

  useEffect(function componentDidMount() {
    function onAppUpdate() {
      dispatch(setUpdateState(true))
    }

    const updater = UpdateService.getInstance()
    updater.on('update', onAppUpdate)
    updater.checkForUpdate(3000)

    return function componentWillUnmount() {
      updater.removeListener('update', onAppUpdate)
    }
  })

  return <div className="app">{props.children}</div>
}

export default App
