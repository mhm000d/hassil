import Navbar from '../components/Navbar/Navbar'
import Hero from '../components/LandingPage/Hero/Hero'
import BridgingSection from '../components/LandingPage/BridgingSection/BridgingSection'
import WhyHassil from '../components/LandingPage/WhyHassil/WhyHassil'
import CtaSection from '../components/LandingPage/CtaSection/CtaSection'
import Footer from '../components/Footer/Footer'
import AnimatedBackground from '../components/LandingPage/AnimatedBackground/AnimatedBackground'

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
