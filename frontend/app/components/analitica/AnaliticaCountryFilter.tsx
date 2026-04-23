"use client";

import { useMemo, useState } from "react";

type Company = {
  name: string;
  country: string;
  signal: string;
  status: string;
};

type AnaliticaCountryFilterProps = {
  companies: readonly Company[];
};

export default function AnaliticaCountryFilter({
  companies,
}: AnaliticaCountryFilterProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("Todos");

  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(companies.map((company) => company.country))
    );
    return ["Todos", ...uniqueCountries];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    if (selectedCountry === "Todos") {
      return companies;
    }

    return companies.filter((company) => company.country === selectedCountry);
  }, [companies, selectedCountry]);

  return (
    <article className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
            Cobertura
          </p>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Analisis mundial por pais
          </h2>
        </div>

        <div className="rounded-full bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
          Mapa
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {countries.map((country) => {
          const isActive = selectedCountry === country;

          return (
            <button
              key={country}
              type="button"
              onClick={() => setSelectedCountry(country)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {country}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {selectedCountry === "Todos"
            ? `Mostrando ${filteredCompanies.length} empresas de todos los paises`
            : `Mostrando ${filteredCompanies.length} empresas de ${selectedCountry}`}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Empresa", "Pais", "Señal", "Estado"].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <tr
                  key={`${company.name}-${company.country}`}
                  className="transition hover:bg-emerald-50/40"
                >
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">{company.name}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {company.country}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {company.signal}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                      {company.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No hay empresas para el pais seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}