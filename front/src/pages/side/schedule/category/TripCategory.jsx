import React, { useState } from "react";
import { motion } from "framer-motion";
import StepRegionSelect from "./StepRegionSelect";
import StepDistrictSelect from "./StepDistrictSelect";
import StepDurationSelect from "./StepDurationSelect";
import StepCompanion from "./StepCompanion";
import StepThemeSelect from "./StepThemeSelect";
import CategoryHeader from "./CategoryHeader";
import CategoryFooter from "./CategoryFooter";

const TripCategory = () => {
  const [step, setStep] = useState(1);
  
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedDays, setSelectedDays] = useState(null);
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [selectedThemes, setSelectedThemes] = useState([]);

  const next = () => setStep((prev) => Math.min(prev + 1, 5));
  const prev = () => setStep((prev) => Math.max(prev - 1, 1));

  const steps = [
    <StepRegionSelect
      selectedCity={selectedCity}
      setSelectedCity={setSelectedCity}
      goNext={next}
    />,
    <StepDistrictSelect
      selectedCity={selectedCity}
      selectedDistrict={selectedDistrict}
      setSelectedDistrict={setSelectedDistrict}
      goNext={next}
      goPrev={prev}
    />,
    <StepDurationSelect
      selectedDays={selectedDays}
      setSelectedDays={setSelectedDays}
      goNext={next}
      goPrev={prev}
    />,
    <StepCompanion
      selectedCompanion={selectedCompanion}
      setSelectedCompanion={setSelectedCompanion}
      goNext={next}
      goPrev={prev}
    />,
    <StepThemeSelect
      selectedThemes={selectedThemes}
      setSelectedThemes={setSelectedThemes}
      selectedCity={selectedCity}
      selectedDistrict={selectedDistrict}
      selectedDays={selectedDays}
      selectedCompanion={selectedCompanion}
      goPrev={prev}
    />,
  ];

  return (
    <>
      <CategoryHeader step={step} />

      <motion.div
        className="category-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {steps[step - 1]}
      </motion.div>

      <CategoryFooter />
    </>
  );
};

export default TripCategory;
