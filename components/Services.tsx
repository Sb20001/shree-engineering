import { motion } from "motion/react";
import { Settings, Package, Headphones, TrendingUp, Award, Clock } from "lucide-react";

export function Services() {
  const services = [
    {
      icon: <Settings className="w-12 h-12" />,
      title: "Custom Manufacturing",
      description: "We manufacture custom parts to your exact specifications, ensuring perfect fit and optimal performance for your machinery.",
      features: ["Precision engineering", "Quality materials", "Fast turnaround"]
    },
    {
      icon: <Package className="w-12 h-12" />,
      title: "Bulk Supply",
      description: "Large volume orders with competitive pricing and dedicated account management for industrial clients.",
      features: ["Volume discounts", "Priority shipping", "Dedicated support"]
    },
    {
      icon: <Headphones className="w-12 h-12" />,
      title: "Technical Support",
      description: "Expert guidance from our technical team to help you select the right parts and troubleshoot issues.",
      features: ["24/7 availability", "Expert engineers", "Remote diagnostics"]
    },
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: "Maintenance Programs",
      description: "Scheduled maintenance and replacement part programs to keep your operations running smoothly.",
      features: ["Preventive care", "Cost savings", "Reduced downtime"]
    },
    {
      icon: <Award className="w-12 h-12" />,
      title: "Quality Certification",
      description: "All parts come with quality certifications and compliance documentation for industry standards.",
      features: ["ISO certified", "Compliance docs", "Warranty included"]
    },
    {
      icon: <Clock className="w-12 h-12" />,
      title: "Emergency Service",
      description: "Urgent part delivery and expedited manufacturing for critical situations and downtime prevention.",
      features: ["Same-day delivery", "Rush orders", "Emergency hotline"]
    }
  ];

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl mb-4 text-gray-900">Our Services</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive solutions for all your industrial machinery parts needs
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                {service.icon}
              </div>
              <h3 className="text-2xl mb-4 text-gray-900">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Process Section */}
        <motion.div
          className="bg-white rounded-2xl p-12 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl mb-12 text-center text-gray-900">Our Process</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Consultation", desc: "Discuss your needs" },
              { step: "02", title: "Selection", desc: "Choose the right parts" },
              { step: "03", title: "Order", desc: "Secure processing" },
              { step: "04", title: "Delivery", desc: "Fast shipping" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl text-blue-600 mb-4">{item.step}</div>
                <h4 className="text-xl mb-2 text-gray-900">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
