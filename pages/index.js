import LanguageReactorClone from '../components/LanguageReactorClone'
import AIChatInterface from '../components/AIChatInterface'

export default function Home() {
  return (
    <div>
      {/* Sección existente - YouTube */}
      <section className="py-8">
        <LanguageReactorClone />
      </section>

      {/* Nueva sección - Chat con IA */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Conversa con tu Asistente de IA
          </h2>
          <AIChatInterface />
        </div>
      </section>
    </div>
  )
}

export async function getStaticProps() {
  return {
    props: {},
  }
}
