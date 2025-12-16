export default function ContactPage() {
  return (
    <main className="max-w-xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-light mb-6">
        Request a Private Consultation
      </h1>

      <p className="text-gray-600 mb-10">
        Every conversation is private, obligation-free, and focused on
        understanding what truly suits you.
      </p>

      <form className="space-y-6">
        <input
          type="text"
          placeholder="Your Name"
          className="w-full border px-4 py-3"
        />
        <input
          type="email"
          placeholder="Email Address"
          className="w-full border px-4 py-3"
        />
        <input
          type="text"
          placeholder="Preferred Location"
          className="w-full border px-4 py-3"
        />
        <button
          type="submit"
          className="border border-black px-6 py-3 hover:bg-black hover:text-white transition"
        >
          Request Consultation
        </button>
      </form>
    </main>
  );
}
