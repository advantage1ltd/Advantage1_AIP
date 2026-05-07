import { useState } from "react"
import { PersonalInfoStep } from "./steps/PersonalInfoStep"
import { AddressStep } from "./steps/AddressStep"
import { PositionStep } from "./steps/PositionStep"
import { LicensingStep } from "./steps/LicensingStep"
import { OnboardingStep } from "./steps/OnboardingStep"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "./EmployeesTable"

interface EmployeeRegistrationFormProps {
  mode: 'new' | 'edit'
  employee?: Employee
  onCancel: () => void
}

export function EmployeeRegistrationForm({ mode, employee, onCancel }: EmployeeRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<'personal' | 'address' | 'position' | 'licensing' | 'onboarding'>('personal')
  const { toast } = useToast()
  
  const handleSubmit = () => {
    toast({
      title: "Success",
      description: "Employee registration completed successfully",
    })
    onCancel()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="space-x-2">
          {['personal', 'address', 'position', 'licensing', 'onboarding'].map((step) => (
            <Button
              key={step}
              variant={currentStep === step ? "default" : "outline"}
              onClick={() => setCurrentStep(step as typeof currentStep)}
              className="capitalize"
            >
              {step}
            </Button>
          ))}
        </div>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      {(() => {
        switch (currentStep) {
          case 'personal':
            return <PersonalInfoStep onNext={() => setCurrentStep('address')} />
          case 'address':
            return (
              <AddressStep 
                onNext={() => setCurrentStep('position')}
                onBack={() => setCurrentStep('personal')}
              />
            )
          case 'position':
            return (
              <PositionStep 
                onNext={() => setCurrentStep('licensing')}
                onBack={() => setCurrentStep('address')}
              />
            )
          case 'licensing':
            return (
              <LicensingStep 
                onNext={() => setCurrentStep('onboarding')}
                onBack={() => setCurrentStep('position')}
              />
            )
          case 'onboarding':
            return (
              <OnboardingStep 
                onSubmit={handleSubmit}
                onBack={() => setCurrentStep('licensing')}
              />
            )
        }
      })()}
    </div>
  )
}