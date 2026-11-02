import Hero, { TopNav } from './components/Hero.jsx'
import SpringDrive from './components/SpringDrive.jsx'
import Omega from './components/Omega.jsx'
import GShock from './components/GShock.jsx'
import Mechanics from './components/Mechanics.jsx'
import { Archive, Credits, Sky } from './components/Archive.jsx'

export default function App() {
  return (
    <>
      <TopNav />
      <main>
        <Hero />
        <SpringDrive />
        <Omega />
        <GShock />
        <Mechanics />
        <Archive />
        <Sky />
      </main>
      <Credits />
    </>
  )
}
