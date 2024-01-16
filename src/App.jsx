import { Provider } from './stories/Provider'
import ThreeBox from './stories/ThreeBox'

function App() {
  return (
    <Provider wipe>
      <ThreeBox />
    </Provider>
  )
}

export default App
