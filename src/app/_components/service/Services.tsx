import Service from './Service';

export default function Services() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-0">
        <span className="text-gray-300 text-lg font-semibold">Services</span>
        <span className="text-gray-500 text-sm">
          I make custom websites & web apps. Please click Consult to send me an
          overview of your desired product via email. Then we will discuss the
          detailed requirements via emails, texts, or calls. Please click Order
          to pay 50% upfront and the remaining 50% upon delivery. Additional
          pages and revisions cost $30 each.
        </span>
      </div>

      <div className="flex flex-col gap-2 lg:gap-4">
        <Service
          serviceId="basic"
          title="Basic: Website/Blog"
          price="$150"
          features={[
            'Pages: home, admin, login, custom x1',
            'Revisions x1',
            // '7 days delivery',
            'Content upload',
            'Social media icons',
            'Responsive design',
            'Hosting setup',
            '6-month maintenance',
          ]}
        />
        <Service
          serviceId="standard"
          title="Standard: Web App"
          price="$400"
          features={[
            'Pages: home, admin, login, payment, custom x3',
            'Revisions x3',
            // '14 days delivery',
            'Everything in Basic, plus:',
            'Payment integration',
            'Speed optimization',
            'SEO optimization',
            'Web analytics',
            '12-month maintenance',
          ]}
        />
        {/* <Service
          title="Premium: E-commerce"
          price="$700"
          features={[
            'Pages: home, admin, login, custom x5',
            'E-commerce pages: search, pay, sell, cart',
            'Revisions x5',
            '21 days delivery',
            'Everything in Standard, plus:',
            'Speed optimization',
            'Autoresponder integration',
            'Scalable Architecture',
          ]}
        /> */}
      </div>
    </section>
  );
}
