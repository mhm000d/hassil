import Navbar from '../components/Navbar/Navbar'
import Hero from '../components/Hero/Hero'
import BridgingSection from '../components/BridgingSection/BridgingSection'
import WhyHassil from '../components/WhyHassil/WhyHassil'
import CtaSection from '../components/CtaSection/CtaSection'
import Footer from '../components/Footer/Footer'

export default function LandingPage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <BridgingSection />
                <WhyHassil />
                <CtaSection />
            </main>
            <Footer />
        </>
    )
}
