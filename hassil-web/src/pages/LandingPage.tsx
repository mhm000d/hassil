import Navbar from '../components/Navbar/Navbar'
import Hero from '../components/Hero/Hero'
import BridgingSection from '../components/BridgingSection/BridgingSection'
import WhyHassil from '../components/WhyHassil/WhyHassil'
import CtaSection from '../components/CtaSection/CtaSection'
import Footer from '../components/Footer/Footer'
import AnimatedBackground from '../components/AnimatedBackground/AnimatedBackground'

export default function LandingPage() {
    return (
        <>
            <AnimatedBackground />
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
