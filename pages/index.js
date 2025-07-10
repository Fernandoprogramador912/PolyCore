import LanguageReactorClone from '../components/LanguageReactorClone'

export default function Home() {
  return (
    <div>
      <LanguageReactorClone />
    </div>
  )
}

export async function getStaticProps() {
  return {
    props: {},
  }
}
