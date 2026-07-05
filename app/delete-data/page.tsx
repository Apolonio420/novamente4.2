import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Eliminación de Datos',
    description: 'Solicitá la eliminación de tus datos personales de Novamente.',
}

export default function DeleteDataPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Solicitud de Eliminación de Datos</h1>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Tus derechos sobre tus datos</h2>
                    <p className="text-gray-700">
                        Tenés derecho a solicitar la eliminación completa de todos tus datos personales
                        almacenados en nuestros sistemas. Esto incluye:
                    </p>
                    <ul className="list-disc ml-6 mt-2 text-gray-700">
                        <li>Historial de conversaciones con nuestro chatbot (WhatsApp e Instagram)</li>
                        <li>Información de contacto (nombre, teléfono, email)</li>
                        <li>Imágenes y diseños enviados</li>
                        <li>Historial de pedidos</li>
                        <li>Datos de sesión en la plataforma de partners</li>
                        <li>Cualquier otro dato personal asociado a tu cuenta</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Cómo solicitar la eliminación</h2>
                    <p className="text-gray-700 mb-4">
                        Para solicitar la eliminación de tus datos, enviá un correo electrónico a:
                    </p>
                    <a
                        href="mailto:contact@novamente.ar?subject=Solicitud de eliminación de datos"
                        className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        📧 Solicitar eliminación de datos
                    </a>
                    <p className="text-gray-600 mt-4 text-sm">
                        En tu correo, incluí el número de teléfono o el usuario de Instagram asociado a tu cuenta.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Plazo de respuesta</h2>
                    <p className="text-gray-700">
                        Procesaremos tu solicitud dentro de los 30 días hábiles siguientes a la recepción.
                        Recibirás una confirmación por correo electrónico una vez que tus datos hayan sido eliminados.
                    </p>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Información que podemos retener</h2>
                    <p className="text-gray-700">
                        Podemos retener cierta información cuando sea requerido por ley, como:
                    </p>
                    <ul className="list-disc ml-6 mt-2 text-gray-700">
                        <li>Registros de transacciones por requisitos fiscales (AFIP, Argentina)</li>
                        <li>Información necesaria para resolver disputas pendientes</li>
                        <li>Datos agregados/anonimizados que ya no te identifican personalmente</li>
                    </ul>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Contacto</h2>
                    <p className="text-gray-700">
                        Para otras consultas sobre privacidad:{' '}
                        <a href="mailto:contact@novamente.ar" className="text-blue-600 hover:underline">
                            contact@novamente.ar
                        </a>
                    </p>
                </section>
            </div>
        </main>
    )
}
