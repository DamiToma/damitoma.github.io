import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import ProjectResume from "../components/ProjectResume";
import { showResume } from "../data/portfolio.json";
import { resume } from "../data/portfolio.json";

const Resume = () => {
  const router = useRouter();
  const [mount, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
    if (!showResume) {
      router.push("/");
    }
  }, []);
  return (
    <>
      <div
        className={`container mx-auto mb-10`}
      >
        <Header isBlog />
        {mount && (
          <div className="mt-10 w-full flex flex-col items-center">
            <div
              className={`w-full ${
                mount && "bg-slate-800"
              } max-w-4xl p-20 mob:p-5 desktop:p-20 rounded-lg shadow-sm`}
            >
              <h1 className="text-3xl font-bold">Damiano Tomazzolli</h1>
              <h2 className="text-xl mt-5">{resume.tagline}</h2>
              <h2 className="w-4/5 text-xl mt-5 opacity-50">
                {resume.description}
              </h2>
              <div className="mt-5">
                <h1 className="text-2xl font-bold">Experience</h1>

                {resume.experiences.map(
                  ({ id, dates, type, position, bullets, skills }) => (
                    <ProjectResume
                      key={id}
                      dates={dates}
                      type={type}
                      position={position}
                      bullets={bullets}
                      skills={skills}
                    ></ProjectResume>
                  )
                )}
              </div>
              <div className="mt-5">
                <h1 className="text-2xl font-bold">Education</h1>
                {
                  resume.education.map((row) => (
                    <div className="mt-2 mb-1" key={row.universityName}>
                      <h2 className="text-lg">{row.universityName}</h2>
                      <h3 className="text-sm opacity-75">
                        {row.universityDate}
                      </h3>
                      <p className="text-sm mt-2 opacity-50">
                        {row.universityPara}
                      </p>

                      {
                        row.coursework && (
                          <p className="text-sm mt-2 opacity-50">
                            <b>Coursework</b>:&nbsp;{row.coursework}
                          </p>
                        )
                      }
                    </div>
                  ))
                }
              </div>
              <div className="mt-5">
                <h1 className="text-2xl font-bold">Interests & Skills</h1>
                <div className="flex flex-col md:flex-row md:justify-between gap-4 mt-2">
                  <div><b>Languages</b>: English (C2 Proficiency), Italian (Native)</div>
                  <div><b>Hobbies</b>: Studied piano and classical music for nearly a decade</div>
                  <div><b>Passion</b>: Passionate about Formula 1 and fascinated by its technology since childhood</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Resume;
