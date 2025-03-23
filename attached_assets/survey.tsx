import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckIcon, ChevronsUpDown, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subjects: z.array(z.string()).min(1, "Please select at least one subject"),
  interests: z.string().min(2, "Interests must be at least 2 characters"),
  skills: z.string().min(2, "Skills must be at least 2 characters"),
  goal: z.string().min(1, "Please enter a goal"),
  thinking_style: z.enum(["Plan", "Flow"]),
  extra_info: z.string().optional(),
});

// Define the subjects available for selection
const subjects = [
  { label: "Computer Science", value: "Computer Science" },
  { label: "Biology", value: "Biology" },
  { label: "Literature", value: "Literature" },
  { label: "Engineering", value: "Engineering" },
  { label: "Arts", value: "Arts" },
  { label: "Mathematics", value: "Mathematics" },
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Psychology", value: "Psychology" },
  { label: "Economics", value: "Economics" },
  { label: "Business", value: "Business" },
  { label: "Medicine", value: "Medicine" },
];

export default function Survey() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subjects: [],
      interests: "",
      skills: "",
      goal: "",
      thinking_style: "Plan",
      extra_info: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // Use the apiRequest function to call our Express API
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data && data.success) {
        toast({
          title: "Survey Submitted!",
          description: "Your career journey is ready to begin.",
        });

        // Save the userId in localStorage for future reference
        if (data.userId) {
          localStorage.setItem('userId', data.userId.toString());
        }

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        throw new Error("Failed to submit survey");
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const removeSubject = (subject: string) => {
    const newSelectedSubjects = selectedSubjects.filter(s => s !== subject);
    setSelectedSubjects(newSelectedSubjects);
    form.setValue("subjects", newSelectedSubjects);
  };

  return (
    <div className="container max-w-3xl py-10 mx-auto">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome to Emerge!</CardTitle>
          <CardDescription>
            Let's get to know you better to personalize your career guidance journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Input */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />

  <FormField
    control={form.control}
    name="avatar"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Profile Picture (Optional)</FormLabel>
        <FormControl>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2">
              <AvatarImage src={field.value || undefined} />
              <AvatarFallback>
                <Upload className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    field.onChange(reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        </FormControl>
        <FormDescription>
          Upload a profile picture or leave empty to use default avatar
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />

                  </FormItem>
                )}
              />

              {/* Email Input */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subjects Selection */}
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subjects</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value.length && "text-muted-foreground"
                            )}
                          >
                            {field.value.length > 0
                              ? `${field.value.length} selected`
                              : "Select subjects"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search subjects..." />
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            {subjects.map((subject) => (
                              <CommandItem
                                key={subject.value}
                                value={subject.value}
                                onSelect={() => {
                                  const isSelected = selectedSubjects.includes(subject.value);
                                  const newSelectedSubjects = isSelected
                                    ? selectedSubjects.filter(s => s !== subject.value)
                                    : [...selectedSubjects, subject.value];

                                  form.setValue("subjects", newSelectedSubjects);
                                  setSelectedSubjects(newSelectedSubjects);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedSubjects.includes(subject.value)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {subject.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Display selected subjects as badges */}
                    {selectedSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSubjects.map((subject) => (
                          <Badge key={subject} variant="secondary" className="px-2 py-1">
                            {subject}
                            <X 
                              className="ml-1 h-3 w-3 cursor-pointer" 
                              onClick={() => removeSubject(subject)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}

                    <FormDescription>
                      Select your fields of study and interests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interests */}
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests & Hobbies</FormLabel>
                    <FormControl>
                      <Input placeholder="Reading, traveling, puzzles..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Share your personal interests and hobbies.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills */}
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="Programming, lab work, writing..." {...field} />
                    </FormControl>
                    <FormDescription>
                      List your technical and soft skills.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Career Goal */}
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Career Goal</FormLabel>
                    <Input placeholder="Your Career Goal" {...field} />
                    <FormDescription>
                      What are you looking to achieve in the near future?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Thinking Style */}
              <FormField
                control={form.control}
                name="thinking_style"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Thinking Style</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Plan" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Plan: I prefer structure and organization
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Flow" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Flow: I prefer flexibility and adaptation
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              

              {/* Extra Info */}
              <FormField
                control={form.control}
                name="extra_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share anything else that might help us personalize your experience..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Start My Journey"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}