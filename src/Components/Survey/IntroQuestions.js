// src/Components/Survey/IntroQuestions.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select from 'react-select';
import Button from '../Common/Button';
import './IntroQuestions.css';
import { ageFromDOB, academicStartYear } from '../../utils/educationProgression';
import { getIdentityProfile, IDENTITY_LOCK_ENABLED } from '../../utils/identityProfile';

const countryOptions = [
  {
    label: 'Popular',
    options: [
      { value: 'United Kingdom', label: 'United Kingdom' },
      { value: 'United States', label: 'United States' },
    ],
  },
  {
    label: 'All countries',
    options: [
      { value: "Afghanistan", label: "Afghanistan" },
      { value: "Albania", label: "Albania" },
      { value: "Algeria", label: "Algeria" },
      { value: "American Samoa", label: "American Samoa" },
      { value: "Andorra", label: "Andorra" },
      { value: "Angola", label: "Angola" },
      { value: "Anguilla", label: "Anguilla" },
      { value: "Antarctica", label: "Antarctica" },
      { value: "Antigua and Barbuda", label: "Antigua and Barbuda" },
      { value: "Argentina", label: "Argentina" },
      { value: "Armenia", label: "Armenia" },
      { value: "Aruba", label: "Aruba" },
      { value: "Australia", label: "Australia" },
      { value: "Austria", label: "Austria" },
      { value: "Azerbaijan", label: "Azerbaijan" },
      { value: "Bahamas", label: "Bahamas" },
      { value: "Bahrain", label: "Bahrain" },
      { value: "Bangladesh", label: "Bangladesh" },
      { value: "Barbados", label: "Barbados" },
      { value: "Belarus", label: "Belarus" },
      { value: "Belgium", label: "Belgium" },
      { value: "Belize", label: "Belize" },
      { value: "Benin", label: "Benin" },
      { value: "Bermuda", label: "Bermuda" },
      { value: "Bhutan", label: "Bhutan" },
      { value: "Bolivia", label: "Bolivia" },
      { value: "Bonaire, Sint Eustatius and Saba", label: "Bonaire, Sint Eustatius and Saba" },
      { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
      { value: "Botswana", label: "Botswana" },
      { value: "Bouvet Island", label: "Bouvet Island" },
      { value: "Brazil", label: "Brazil" },
      { value: "British Indian Ocean Territory", label: "British Indian Ocean Territory" },
      { value: "British Virgin Islands", label: "British Virgin Islands" },
      { value: "Brunei", label: "Brunei" },
      { value: "Bulgaria", label: "Bulgaria" },
      { value: "Burkina Faso", label: "Burkina Faso" },
      { value: "Burundi", label: "Burundi" },
      { value: "Cambodia", label: "Cambodia" },
      { value: "Cameroon", label: "Cameroon" },
      { value: "Canada", label: "Canada" },
      { value: "Cape Verde", label: "Cape Verde" },
      { value: "Cayman Islands", label: "Cayman Islands" },
      { value: "Central African Republic", label: "Central African Republic" },
      { value: "Chad", label: "Chad" },
      { value: "Chile", label: "Chile" },
      { value: "China", label: "China" },
      { value: "Christmas Island", label: "Christmas Island" },
      { value: "Cocos (Keeling) Islands", label: "Cocos (Keeling) Islands" },
      { value: "Colombia", label: "Colombia" },
      { value: "Comoros", label: "Comoros" },
      { value: "Cook Islands", label: "Cook Islands" },
      { value: "Costa Rica", label: "Costa Rica" },
      { value: "Croatia", label: "Croatia" },
      { value: "Cuba", label: "Cuba" },
      { value: "Curaçao", label: "Curaçao" },
      { value: "Cyprus", label: "Cyprus" },
      { value: "Czech Republic", label: "Czech Republic" },
      { value: "Côte d’Ivoire", label: "Côte d’Ivoire" },
      { value: "Democratic Republic of the Congo", label: "Democratic Republic of the Congo" },
      { value: "Denmark", label: "Denmark" },
      { value: "Djibouti", label: "Djibouti" },
      { value: "Dominica", label: "Dominica" },
      { value: "Dominican Republic", label: "Dominican Republic" },
      { value: "Ecuador", label: "Ecuador" },
      { value: "Egypt", label: "Egypt" },
      { value: "El Salvador", label: "El Salvador" },
      { value: "Equatorial Guinea", label: "Equatorial Guinea" },
      { value: "Eritrea", label: "Eritrea" },
      { value: "Estonia", label: "Estonia" },
      { value: "Eswatini", label: "Eswatini" },
      { value: "Ethiopia", label: "Ethiopia" },
      { value: "Falkland Islands", label: "Falkland Islands" },
      { value: "Faroe Islands", label: "Faroe Islands" },
      { value: "Fiji", label: "Fiji" },
      { value: "Finland", label: "Finland" },
      { value: "France", label: "France" },
      { value: "French Guiana", label: "French Guiana" },
      { value: "French Polynesia", label: "French Polynesia" },
      { value: "French Southern Territories", label: "French Southern Territories" },
      { value: "Gabon", label: "Gabon" },
      { value: "Gambia", label: "Gambia" },
      { value: "Georgia", label: "Georgia" },
      { value: "Germany", label: "Germany" },
      { value: "Ghana", label: "Ghana" },
      { value: "Gibraltar", label: "Gibraltar" },
      { value: "Greece", label: "Greece" },
      { value: "Greenland", label: "Greenland" },
      { value: "Grenada", label: "Grenada" },
      { value: "Guadeloupe", label: "Guadeloupe" },
      { value: "Guam", label: "Guam" },
      { value: "Guatemala", label: "Guatemala" },
      { value: "Guernsey", label: "Guernsey" },
      { value: "Guinea", label: "Guinea" },
      { value: "Guinea-Bissau", label: "Guinea-Bissau" },
      { value: "Guyana", label: "Guyana" },
      { value: "Haiti", label: "Haiti" },
      { value: "Heard Island and McDonald Islands", label: "Heard Island and McDonald Islands" },
      { value: "Holy See (Vatican City State)", label: "Holy See (Vatican City State)" },
      { value: "Honduras", label: "Honduras" },
      { value: "Hong Kong", label: "Hong Kong" },
      { value: "Hungary", label: "Hungary" },
      { value: "Iceland", label: "Iceland" },
      { value: "India", label: "India" },
      { value: "Indonesia", label: "Indonesia" },
      { value: "Iran", label: "Iran" },
      { value: "Iraq", label: "Iraq" },
      { value: "Ireland", label: "Ireland" },
      { value: "Isle of Man", label: "Isle of Man" },
      { value: "Israel", label: "Israel" },
      { value: "Italy", label: "Italy" },
      { value: "Jamaica", label: "Jamaica" },
      { value: "Japan", label: "Japan" },
      { value: "Jersey", label: "Jersey" },
      { value: "Jordan", label: "Jordan" },
      { value: "Kazakhstan", label: "Kazakhstan" },
      { value: "Kenya", label: "Kenya" },
      { value: "Kiribati", label: "Kiribati" },
      { value: "Kuwait", label: "Kuwait" },
      { value: "Kyrgyzstan", label: "Kyrgyzstan" },
      { value: "Laos", label: "Laos" },
      { value: "Latvia", label: "Latvia" },
      { value: "Lebanon", label: "Lebanon" },
      { value: "Lesotho", label: "Lesotho" },
      { value: "Liberia", label: "Liberia" },
      { value: "Libya", label: "Libya" },
      { value: "Liechtenstein", label: "Liechtenstein" },
      { value: "Lithuania", label: "Lithuania" },
      { value: "Luxembourg", label: "Luxembourg" },
      { value: "Macao", label: "Macao" },
      { value: "Madagascar", label: "Madagascar" },
      { value: "Malawi", label: "Malawi" },
      { value: "Malaysia", label: "Malaysia" },
      { value: "Maldives", label: "Maldives" },
      { value: "Mali", label: "Mali" },
      { value: "Malta", label: "Malta" },
      { value: "Marshall Islands", label: "Marshall Islands" },
      { value: "Martinique", label: "Martinique" },
      { value: "Mauritania", label: "Mauritania" },
      { value: "Mauritius", label: "Mauritius" },
      { value: "Mayotte", label: "Mayotte" },
      { value: "Mexico", label: "Mexico" },
      { value: "Micronesia", label: "Micronesia" },
      { value: "Moldova", label: "Moldova" },
      { value: "Monaco", label: "Monaco" },
      { value: "Mongolia", label: "Mongolia" },
      { value: "Montenegro", label: "Montenegro" },
      { value: "Montserrat", label: "Montserrat" },
      { value: "Morocco", label: "Morocco" },
      { value: "Mozambique", label: "Mozambique" },
      { value: "Myanmar", label: "Myanmar" },
      { value: "Namibia", label: "Namibia" },
      { value: "Nauru", label: "Nauru" },
      { value: "Nepal", label: "Nepal" },
      { value: "Netherlands", label: "Netherlands" },
      { value: "New Caledonia", label: "New Caledonia" },
      { value: "New Zealand", label: "New Zealand" },
      { value: "Nicaragua", label: "Nicaragua" },
      { value: "Niger", label: "Niger" },
      { value: "Nigeria", label: "Nigeria" },
      { value: "Niue", label: "Niue" },
      { value: "Norfolk Island", label: "Norfolk Island" },
      { value: "North Korea", label: "North Korea" },
      { value: "North Macedonia", label: "North Macedonia" },
      { value: "Northern Mariana Islands", label: "Northern Mariana Islands" },
      { value: "Norway", label: "Norway" },
      { value: "Oman", label: "Oman" },
      { value: "Pakistan", label: "Pakistan" },
      { value: "Palau", label: "Palau" },
      { value: "Palestine", label: "Palestine" },
      { value: "Panama", label: "Panama" },
      { value: "Papua New Guinea", label: "Papua New Guinea" },
      { value: "Paraguay", label: "Paraguay" },
      { value: "Peru", label: "Peru" },
      { value: "Philippines", label: "Philippines" },
      { value: "Pitcairn", label: "Pitcairn" },
      { value: "Poland", label: "Poland" },
      { value: "Portugal", label: "Portugal" },
      { value: "Puerto Rico", label: "Puerto Rico" },
      { value: "Qatar", label: "Qatar" },
      { value: "Republic of the Congo", label: "Republic of the Congo" },
      { value: "Romania", label: "Romania" },
      { value: "Russia", label: "Russia" },
      { value: "Rwanda", label: "Rwanda" },
      { value: "Réunion", label: "Réunion" },
      { value: "Saint Barthélemy", label: "Saint Barthélemy" },
      { value: "Saint Helena, Ascension and Tristan da Cunha", label: "Saint Helena, Ascension and Tristan da Cunha" },
      { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis" },
      { value: "Saint Lucia", label: "Saint Lucia" },
      { value: "Saint Martin (French part)", label: "Saint Martin (French part)" },
      { value: "Saint Pierre and Miquelon", label: "Saint Pierre and Miquelon" },
      { value: "Saint Vincent and the Grenadines", label: "Saint Vincent and the Grenadines" },
      { value: "Samoa", label: "Samoa" },
      { value: "San Marino", label: "San Marino" },
      { value: "Sao Tome and Principe", label: "Sao Tome and Principe" },
      { value: "Saudi Arabia", label: "Saudi Arabia" },
      { value: "Senegal", label: "Senegal" },
      { value: "Serbia", label: "Serbia" },
      { value: "Seychelles", label: "Seychelles" },
      { value: "Sierra Leone", label: "Sierra Leone" },
      { value: "Singapore", label: "Singapore" },
      { value: "Sint Maarten (Dutch part)", label: "Sint Maarten (Dutch part)" },
      { value: "Slovakia", label: "Slovakia" },
      { value: "Slovenia", label: "Slovenia" },
      { value: "Solomon Islands", label: "Solomon Islands" },
      { value: "Somalia", label: "Somalia" },
      { value: "South Africa", label: "South Africa" },
      { value: "South Georgia and the South Sandwich Islands", label: "South Georgia and the South Sandwich Islands" },
      { value: "South Korea", label: "South Korea" },
      { value: "South Sudan", label: "South Sudan" },
      { value: "Spain", label: "Spain" },
      { value: "Sri Lanka", label: "Sri Lanka" },
      { value: "Sudan", label: "Sudan" },
      { value: "Suriname", label: "Suriname" },
      { value: "Svalbard and Jan Mayen", label: "Svalbard and Jan Mayen" },
      { value: "Sweden", label: "Sweden" },
      { value: "Switzerland", label: "Switzerland" },
      { value: "Syria", label: "Syria" },
      { value: "Taiwan", label: "Taiwan" },
      { value: "Tajikistan", label: "Tajikistan" },
      { value: "Tanzania", label: "Tanzania" },
      { value: "Thailand", label: "Thailand" },
      { value: "Timor-Leste", label: "Timor-Leste" },
      { value: "Togo", label: "Togo" },
      { value: "Tokelau", label: "Tokelau" },
      { value: "Tonga", label: "Tonga" },
      { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
      { value: "Tunisia", label: "Tunisia" },
      { value: "Turkey", label: "Turkey" },
      { value: "Turkmenistan", label: "Turkmenistan" },
      { value: "Turks and Caicos Islands", label: "Turks and Caicos Islands" },
      { value: "Tuvalu", label: "Tuvalu" },
      { value: "U.S. Virgin Islands", label: "U.S. Virgin Islands" },
      { value: "Uganda", label: "Uganda" },
      { value: "Ukraine", label: "Ukraine" },
      { value: "United Arab Emirates", label: "United Arab Emirates" },
      { value: "United States Minor Outlying Islands", label: "United States Minor Outlying Islands" },
      { value: "Uruguay", label: "Uruguay" },
      { value: "Uzbekistan", label: "Uzbekistan" },
      { value: "Vanuatu", label: "Vanuatu" },
      { value: "Venezuela", label: "Venezuela" },
      { value: "Vietnam", label: "Vietnam" },
      { value: "Wallis and Futuna", label: "Wallis and Futuna" },
      { value: "Western Sahara", label: "Western Sahara" },
      { value: "Yemen", label: "Yemen" },
      { value: "Zambia", label: "Zambia" },
      { value: "Zimbabwe", label: "Zimbabwe" },
      { value: "Åland Islands", label: "Åland Islands" }
    ],
  },
];

const flatCountryOptions = countryOptions.flatMap(group => group.options || []);

const ageOptions = [
  { value: '13-15', label: '13–15' },
  { value: '16-18', label: '16–18' },
  { value: '19-21', label: '19–21' },
  { value: '22-24', label: '22–24' },
  { value: '25+', label: '25+' },
];

// Derive the legacy age band from a date of birth so anything downstream that
// still reads `age` keeps working after we switch the input to date of birth.
const ageBandFromDOB = (dob) => {
  const a = ageFromDOB(dob);
  if (a === null || Number.isNaN(a)) return '';
  if (a <= 15) return '13-15';
  if (a <= 18) return '16-18';
  if (a <= 21) return '19-21';
  if (a <= 24) return '22-24';
  return '25+';
};

const statusOptions = [
  { value: 'school_college', label: 'I’m at school or college' },
  { value: 'university',     label: 'I’m at university' },
 ];

const universityLevelOptions = [
  { value: 'undergraduate', label: 'I’m an undergraduate student' },
];

const courseYearOptions = [
  { value: 1, label: 'Year 1' },
  { value: 2, label: 'Year 2' },
  { value: 3, label: 'Year 3' },
  { value: 4, label: 'Year 4' },
  { value: 5, label: 'Year 5' },
];

const getStatusGroupValue = (responses = {}) => {
  const status = responses?.status || '';
  if (responses?.statusGroup) return responses.statusGroup;
  if (status === 'school') return 'school_college';
  if (status === 'undergraduate' || status === 'postgraduate') return 'university';
  if (status === 'other') return 'other';
  return '';
};

const schoolSubjectOptions = [
  { value: 'Accounting, Finance & Economics', label: 'Accounting, Finance & Economics' },
  { value: 'Business, Management & Entrepreneurship', label: 'Business, Management & Entrepreneurship' },
  { value: 'Data, Maths & Analytics', label: 'Data, Maths & Analytics' },
  { value: 'Computer Science, Software & AI', label: 'Computer Science, Software & AI' },
  { value: 'Engineering & Technology', label: 'Engineering & Technology' },
  { value: 'Architecture, Built Environment & Planning', label: 'Architecture, Built Environment & Planning' },
  { value: 'Biological & Biomedical Sciences', label: 'Biological & Biomedical Sciences' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Medicine, Pharmacy & Dentistry', label: 'Medicine, Pharmacy & Dentistry' },
  { value: 'Nursing, Midwifery & Allied Health', label: 'Nursing, Midwifery & Allied Health' },
  { value: 'Psychology & Behaviour', label: 'Psychology & Behaviour' },
  { value: 'Education & Childhood', label: 'Education & Childhood' },
  { value: 'Law, Politics & Public Policy', label: 'Law, Politics & Public Policy' },
  { value: 'Society, Culture, Languages & Global Affairs', label: 'Society, Culture, Languages & Global Affairs' },
  { value: 'Sociology, Anthropology & Social Research', label: 'Sociology, Anthropology & Social Research' },
  { value: 'Marketing, PR & Media', label: 'Marketing, PR & Media' },
  { value: 'Product, Graphic & Animation Design', label: 'Product, Graphic & Animation Design' },
  { value: 'Environment & Sustainability', label: 'Environment & Sustainability' },
  { value: 'Arts, Performance & Creative Media', label: 'Arts, Performance & Creative Media' },
  { value: 'Sport, Exercise & Health', label: 'Sport, Exercise & Health' },
  { value: 'Other', label: 'Other' },
];

const universitySubjectOptions = [
  { value: "Accounting", label: "Accounting" },
  { value: "Accounting and Finance", label: "Accounting and Finance" },
  { value: "Actuarial Science", label: "Actuarial Science" },
  { value: "Advertising and Brand Management", label: "Advertising and Brand Management" },
  { value: "Aeronautical and Aerospace Engineering", label: "Aeronautical and Aerospace Engineering" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Animal Science", label: "Animal Science" },
  { value: "Animation", label: "Animation" },
  { value: "Anthropology", label: "Anthropology" },
  { value: "Architectural Technology", label: "Architectural Technology" },
  { value: "Architecture", label: "Architecture" },
  { value: "Architecture and Urban Planning", label: "Architecture and Urban Planning" },
  { value: "Artificial Intelligence", label: "Artificial Intelligence" },
  { value: "Behavioural Science", label: "Behavioural Science" },
  { value: "Biochemistry", label: "Biochemistry" },
  { value: "Biology", label: "Biology" },
  { value: "Biomedical Engineering", label: "Biomedical Engineering" },
  { value: "Biomedical Science", label: "Biomedical Science" },
  { value: "Biotechnology", label: "Biotechnology" },
  { value: "Business Analytics", label: "Business Analytics" },
  { value: "Business Management", label: "Business Management" },
  { value: "Business Management with Entrepreneurship", label: "Business Management with Entrepreneurship" },
  { value: "Chemical Engineering", label: "Chemical Engineering" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Civil Engineering", label: "Civil Engineering" },
  { value: "Climate Science and Sustainability", label: "Climate Science and Sustainability" },
  { value: "Cognitive Science", label: "Cognitive Science" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "Computer Science and Artificial Intelligence", label: "Computer Science and Artificial Intelligence" },
  { value: "Computer Science with Cyber Security", label: "Computer Science with Cyber Security" },
  { value: "Construction Management", label: "Construction Management" },
  { value: "Counselling and Psychotherapy", label: "Counselling and Psychotherapy" },
  { value: "Criminology", label: "Criminology" },
  { value: "Cyber Security", label: "Cyber Security" },
  { value: "Dance", label: "Dance" },
  { value: "Data Science", label: "Data Science" },
  { value: "Dentistry", label: "Dentistry" },
  { value: "Diagnostic Radiography", label: "Diagnostic Radiography" },
  { value: "Digital Marketing and Social Media", label: "Digital Marketing and Social Media" },
  { value: "Digital Media Production and Technology", label: "Digital Media Production and Technology" },
  { value: "Drama & Theatre Studies", label: "Drama & Theatre Studies" },
  { value: "Early Years Education and Care", label: "Early Years Education and Care" },
  { value: "Ecology and Conservation Biology", label: "Ecology and Conservation Biology" },
  { value: "Economics", label: "Economics" },
  { value: "Economics with Data Science", label: "Economics with Data Science" },
  { value: "Education Studies", label: "Education Studies" },
  { value: "Electrical and Electronic Engineering", label: "Electrical and Electronic Engineering" },
  { value: "Entrepreneurship and Innovation", label: "Entrepreneurship and Innovation" },
  { value: "Environmental Management", label: "Environmental Management" },
  { value: "Environmental Science", label: "Environmental Science" },
  { value: "Fashion Design", label: "Fashion Design" },
  { value: "Film and Television Production", label: "Film and Television Production" },
  { value: "Finance", label: "Finance" },
  { value: "Finance and Financial Technology", label: "Finance and Financial Technology" },
  { value: "Financial Mathematics", label: "Financial Mathematics" },
  { value: "Fine Art", label: "Fine Art" },
  { value: "Forensic Psychology", label: "Forensic Psychology" },
  { value: "Forestry", label: "Forestry" },
  { value: "Game Design", label: "Game Design" },
  { value: "Games Technology", label: "Games Technology" },
  { value: "Geography", label: "Geography" },
  { value: "Global Development Studies", label: "Global Development Studies" },
  { value: "Graphic Design", label: "Graphic Design" },
  { value: "Heritage and Museum Studies", label: "Heritage and Museum Studies" },
  { value: "History", label: "History" },
  { value: "Hospitality, Tourism & Events Management", label: "Hospitality, Tourism & Events Management" },
  { value: "Human Resource Management", label: "Human Resource Management" },
  { value: "Human-Computer Interaction", label: "Human-Computer Interaction" },
  { value: "Illustration", label: "Illustration" },
  { value: "Innovation and Technology Management", label: "Innovation and Technology Management" },
  { value: "Interior Architecture and Design", label: "Interior Architecture and Design" },
  { value: "International Business", label: "International Business" },
  { value: "International Relations", label: "International Relations" },
  { value: "Investment Management", label: "Investment Management" },
  { value: "Journalism", label: "Journalism" },
  { value: "Landscape Architecture", label: "Landscape Architecture" },
  { value: "Law", label: "Law" },
  { value: "Law with Criminology", label: "Law with Criminology" },
  { value: "Manufacturing Engineering", label: "Manufacturing Engineering" },
  { value: "Marketing", label: "Marketing" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Mathematics and Statistics", label: "Mathematics and Statistics" },
  { value: "Mechanical Engineering", label: "Mechanical Engineering" },
  { value: "Media Studies", label: "Media Studies" },
  { value: "Medicine", label: "Medicine" },
  { value: "Midwifery", label: "Midwifery" },
  { value: "Modern Languages", label: "Modern Languages" },
  { value: "Music", label: "Music" },
  { value: "Music Technology", label: "Music Technology" },
  { value: "Musical Theatre", label: "Musical Theatre" },
  { value: "Natural Sciences", label: "Natural Sciences" },
  { value: "Neuroscience", label: "Neuroscience" },
  { value: "Nursing", label: "Nursing" },
  { value: "Occupational Therapy", label: "Occupational Therapy" },
  { value: "Operational Research", label: "Operational Research" },
  { value: "Operations and Supply Chain Management", label: "Operations and Supply Chain Management" },
  { value: "Optometry", label: "Optometry" },
  { value: "Paramedic Science", label: "Paramedic Science" },
  { value: "Pharmacology", label: "Pharmacology" },
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Philosophy", label: "Philosophy" },
  { value: "Philosophy, Politics and Economics (PPE)", label: "Philosophy, Politics and Economics (PPE)" },
  { value: "Physics", label: "Physics" },
  { value: "Physiotherapy", label: "Physiotherapy" },
  { value: "Politics", label: "Politics" },
  { value: "Primary Education (QTS)", label: "Primary Education (QTS)" },
  { value: "Product Design", label: "Product Design" },
  { value: "Psychology", label: "Psychology" },
  { value: "Psychology with Neuroscience", label: "Psychology with Neuroscience" },
  { value: "Public Relations and Communications", label: "Public Relations and Communications" },
  { value: "Real Estate & Property", label: "Real Estate & Property" },
  { value: "Robotics and Mechatronic Engineering", label: "Robotics and Mechatronic Engineering" },
  { value: "Secondary Education (QTS)", label: "Secondary Education (QTS)" },
  { value: "Social and Public Policy", label: "Social and Public Policy" },
  { value: "Social Enterprise and Community Development", label: "Social Enterprise and Community Development" },
  { value: "Social Work", label: "Social Work" },
  { value: "Sociology", label: "Sociology" },
  { value: "Software Engineering", label: "Software Engineering" },
  { value: "Sport and Exercise Science", label: "Sport and Exercise Science" },
  { value: "Sports Coaching and Development", label: "Sports Coaching and Development" },
  { value: "Statistics", label: "Statistics" },
  { value: "Sustainable Development", label: "Sustainable Development" },
  { value: "Systems Engineering", label: "Systems Engineering" },
  { value: "Technical Theatre & Stage Management", label: "Technical Theatre & Stage Management" },
  { value: "Urban Planning and Development", label: "Urban Planning and Development" },
  { value: "UX Design and Interaction Design", label: "UX Design and Interaction Design" },
  { value: "Veterinary Medicine", label: "Veterinary Medicine" },
];

// Subject search: match the typed text against the START of the label or the
// start of any word within it, so typing "hi" surfaces "History" rather than
// "arcHItectural Technology" (a mid-word substring match).
function subjectStartsWithFilter(option, rawInput) {
  const input = String(rawInput || '').trim().toLowerCase();
  if (!input) return true;
  const label = String(option?.label || option?.data?.label || '').toLowerCase();
  if (label.startsWith(input)) return true;
  return label.split(/[^a-z0-9]+/).some((word) => word.startsWith(input));
}

const schoolScopeOptions = [
  { value: 'choose_gcse',      label: 'Choosing GCSE subjects or equivalent' },
  { value: 'study_gcse',       label: 'Studying GCSE subjects or equivalent' },
  { value: 'choose_alevels',   label: 'Choosing A-Levels or equivalent' },
  { value: 'study_alevels',    label: 'Studying A-Levels or equivalent' },
  { value: 'apply_uni',        label: 'Preparing to apply to university or college' },
  { value: 'decide_uni',       label: 'Deciding between university offers or options' },
  { value: 'apprenticeship',   label: 'Exploring apprenticeships or work routes' },
  { value: 'not_sure',         label: 'Not sure yet' },
];

const schoolYearOptions = [
  { value: 'year10', label: 'Year 10' },
  { value: 'year11', label: 'Year 11' },
  { value: 'year12', label: 'Year 12' },
  { value: 'year13', label: 'Year 13' },
];

const legacySchoolScopeMap = {
  gcse: 'choose_gcse',
  alevels: 'choose_alevels',
  full_time_jobs: 'apprenticeship',
  full_time_roles: 'apprenticeship',
};

const schoolScopeMappedValues = {
  choose_gcse: 'gcse',
  study_gcse: 'gcse',
  choose_alevels: 'alevels',
  study_alevels: 'alevels',
  apply_uni: 'apply_uni',
  decide_uni: 'apply_uni',
  apprenticeship: 'apprenticeship',
  not_sure: 'not_sure',
};

const getUniOptions = (status) => {
  if (status === 'postgraduate') {
    return [
      { value: 'apply_further_postgrad', label: 'Apply for further postgraduate study' },
      { value: 'explore_internships',    label: 'Explore internships or placements' },
      { value: 'explore_full_time',      label: 'Explore full-time roles' },
      { value: 'explore_specialisms',    label: 'Explore other specialisms/subjects' },
    ];
  }
  return [
    { value: 'explore_internships',  label: 'Explore internships or placements' },
    { value: 'explore_full_time',    label: 'Explore full-time roles' },
    { value: 'apply_postgrad',       label: 'Apply for postgraduate study' },
    { value: 'explore_pathways',     label: 'Explore career pathways and roles' },
  ];
};


const IntroQuestions = ({
  introResponses: introResponsesProp,
  setIntroResponses: setIntroResponsesProp,
  responses,
  setResponses,
  onStartSurvey,
  onNext,
  onBack,
  mode = 'start',
  submitLabel = 'Discover your Career DNA!',
  overrideNextLabel,
  isLoading = false,
  showBackButton = false,
  embedded = false,
}) => {
  const introResponses = introResponsesProp ?? responses ?? {};
  const setIntroResponses = setIntroResponsesProp ?? setResponses ?? (() => {});
  const handleSubmit = onStartSurvey || onNext;
  const finalSubmitLabel = overrideNextLabel || submitLabel;

  const [isComplete, setIsComplete] = useState(false);
  const isEditMode = mode === 'edit' || embedded;

  const [touched, setTouched] = useState({});
  const [showEarlySubjectWarning, setShowEarlySubjectWarning] = useState(false);
  const [pendingEarlySubjectWarning, setPendingEarlySubjectWarning] = useState(false);
  const [earlySubjectWarningDismissed, setEarlySubjectWarningDismissed] = useState(false);
  const [earlySubjectWarningAccepted, setEarlySubjectWarningAccepted] = useState(false);
  const [identityLocked, setIdentityLocked] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const setFieldTouched = (name) => setTouched((t) => ({ ...t, [name]: true }));

  const errors = useMemo(() => {
    const v = introResponses || {};
    const out = {};
    if (!v.country) out.country = 'Please select your country.';
    // DOB is only asked (and validated) on the first assessment, not when
    // editing output parameters.
    if (!isEditMode) {
      if (!v.dateOfBirth) {
        out.dateOfBirth = 'Please enter your date of birth.';
      } else {
        const yrs = ageFromDOB(v.dateOfBirth);
        if (yrs === null || yrs < 10 || yrs > 100) {
          out.dateOfBirth = 'Please enter a valid date of birth.';
        }
      }
    }
    const statusGroup = getStatusGroupValue(v);
    if (!statusGroup) out.status = 'Please select your current status.';
    if (statusGroup === 'university' && !['undergraduate', 'postgraduate'].includes(v.status)) {
      out.universityLevel = 'Please select whether you are an undergraduate or postgraduate student.';
    }

    if (['school', 'undergraduate', 'postgraduate'].includes(v.status)) {
      if (!v.institution || !v.institution.trim()) {
        out.institution = v.status === 'school'
          ? 'Please enter your school.'
          : 'Please enter your college or university.';
      }
    }

    if (v.status === 'undergraduate' || v.status === 'postgraduate') {
      if (!v.courseYear) out.courseYear = 'Please select your year of study.';
      if (!v.uniNeed) out.uniNeed = 'Please select your next step.';
      if (!v.uniSubject) out.uniSubject = 'Please choose your subject.';
    }

    if (v.status === 'school') {
      if (!v.schoolYear) out.schoolYear = 'Please select your year group.';
      if (!v.planUniversity) out.planUniversity = 'Please tell us if you plan to study at university.';
      if (!v.schoolScope) out.schoolScope = 'Please select your next step.';
      if (v.schoolSubjects !== undefined && !Array.isArray(v.schoolSubjects)) {
        out.schoolSubjects = 'Please choose subjects from the list (or leave it blank).';
      }
    }

    if (v.status === 'other') {
      if (!v.currentActivity || !v.currentActivity.trim()) {
        out.currentActivity = 'Please tell us what you are doing right now.';
      }
      if (!v.planUniversity) out.planUniversity = 'Please tell us if you plan to study at university.';
      if (!v.schoolScope) out.schoolScope = 'Please select your next step.';
    }

    return out;
  }, [introResponses, isEditMode]);

  useEffect(() => {
    setIsComplete(Object.keys(errors).length === 0);
  }, [errors]);

  const prevStatusRef = useRef(introResponses?.status);
  const SCROLL_OFFSET = 96;

  const scrollToEl = (el) => {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    } catch {}
    if (!isEditMode) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  }, [isEditMode]);

  useEffect(() => {
    const curr = introResponses?.status;
    if (!curr) return;
    const prev = prevStatusRef.current;
    if (prev === curr) return;
    prevStatusRef.current = curr;

    requestAnimationFrame(() => {
      const target =
        document.getElementById('institutionInput') ||
        document.getElementById('otherActivityInput') ||
        document.getElementById('statusSelect');
      scrollToEl(target);
    });
  }, [introResponses?.status]);

  useEffect(() => {
    const currentScope = introResponses?.schoolScope;
    if (!currentScope) return;

    const upgradedScope = legacySchoolScopeMap[currentScope];
    const mappedScope = schoolScopeMappedValues[upgradedScope || currentScope] || currentScope;

    if (upgradedScope || introResponses?.schoolScopeMapped !== mappedScope) {
      setIntroResponses(prev => ({
        ...prev,
        schoolScope: upgradedScope || prev.schoolScope,
        schoolScopeMapped: mappedScope,
      }));
    }
  }, [introResponses?.schoolScope, introResponses?.schoolScopeMapped, setIntroResponses]);

  useEffect(() => {
    const st = introResponses?.status;
    const need = introResponses?.uniNeed;
    if (!need) return;

    const mapCommon = {
      internships:  'explore_internships',
      full_time:    'explore_full_time',
      specialism:   'explore_pathways',
      cv:           '',
    };

    let mapped = mapCommon[need];
    if (!mapped && need === 'apply_masters') {
      mapped = (st === 'postgraduate') ? 'apply_further_postgrad' : 'apply_postgrad';
    }
    if (mapped !== undefined && mapped !== need) {
      setIntroResponses(prev => ({ ...prev, uniNeed: mapped || undefined }));
    }
  }, [introResponses?.uniNeed, introResponses?.status, setIntroResponses]);

  const handleChange = (field, value) => {
    setIntroResponses(prev => ({ ...prev, [field]: value }));
  };

  // DOB drives the derived age band; both are stored so downstream code that
  // reads `age` is unaffected.
  const handleDobChange = (value) => {
    if (identityLocked) return;
    setIntroResponses(prev => ({ ...prev, dateOfBirth: value, age: ageBandFromDOB(value) }));
  };

  // University course year -> stored start year (drives automatic progression).
  const handleCourseYearChange = (yearNum) => {
    const startYear = academicStartYear(new Date()) - (Number(yearNum) - 1);
    setIntroResponses(prev => ({ ...prev, courseYear: Number(yearNum), courseStartYear: startYear }));
  };

  // Load locked identity from the profile: prefill DOB/country and lock them.
  // Disabled while IDENTITY_LOCK_ENABLED is false (experiment mode).
  useEffect(() => {
    if (!IDENTITY_LOCK_ENABLED) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const p = await getIdentityProfile();
        if (cancelled || !p) return;
        // Only DOB is permanent identity and gets locked. Country is
        // situational (people move / study abroad), so it stays editable.
        if (p.date_of_birth) {
          setIntroResponses(prev => ({
            ...prev,
            dateOfBirth: p.date_of_birth,
            age: ageBandFromDOB(p.date_of_birth),
          }));
          setIdentityLocked(true);
        }
      } catch (e) {
        /* ignore: intro still works without a saved profile */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shouldWarnAboutEarlySubjects = () => {
    const scope = introResponses?.schoolScope;
    return scope === 'choose_gcse' || scope === 'study_gcse';
  };

  const handleSchoolSubjectsChange = (selected) => {
    const nextSubjects = selected && selected.length > 0
      ? selected.slice(0, 2).map(s => s.value)
      : [];

    const previousSubjects = Array.isArray(introResponses.schoolSubjects)
      ? introResponses.schoolSubjects
      : [];

    const changed =
      nextSubjects.length !== previousSubjects.length ||
      nextSubjects.some(subject => !previousSubjects.includes(subject));

    if (changed) {
      setEarlySubjectWarningAccepted(false);
      setEarlySubjectWarningDismissed(false);
    }

    if (nextSubjects.length > 0 && shouldWarnAboutEarlySubjects()) {
      setPendingEarlySubjectWarning(true);
    }

    handleChange('schoolSubjects', nextSubjects);
  };

  const handleSchoolSubjectsMenuClose = () => {
    if (pendingEarlySubjectWarning && !earlySubjectWarningAccepted) {
      setShowEarlySubjectWarning(true);
      setPendingEarlySubjectWarning(false);
    }
  };

  const dismissEarlySubjectWarning = () => {
    setShowEarlySubjectWarning(false);
    setPendingEarlySubjectWarning(false);
    setEarlySubjectWarningDismissed(false);
    setEarlySubjectWarningAccepted(true);
  };

  const clearEarlySubjectChoices = () => {
    handleChange('schoolSubjects', []);
    setShowEarlySubjectWarning(false);
    setPendingEarlySubjectWarning(false);
    setEarlySubjectWarningDismissed(false);
    setEarlySubjectWarningAccepted(false);
  };

  const handleStatusGroupChange = (selected) => {
    const value = selected?.value || '';

    if (value === 'school_college') {
      setIntroResponses(prev => ({
        ...prev,
        statusGroup: 'school_college',
        status: 'school',
        uniNeed: undefined,
        uniSubject: undefined,
      }));
      return;
    }

    if (value === 'university') {
      setIntroResponses(prev => ({
        ...prev,
        statusGroup: 'university',
        status: ['undergraduate', 'postgraduate'].includes(prev.status) ? prev.status : '',
        planUniversity: undefined,
        schoolScope: undefined,
        schoolScopeMapped: undefined,
        schoolSubjects: [],
        currentActivity: undefined,
      }));
      return;
    }

    if (value === 'other') {
      setIntroResponses(prev => ({
        ...prev,
        statusGroup: 'other',
        status: 'other',
        uniNeed: undefined,
        uniSubject: undefined,
        schoolSubjects: [],
      }));
      return;
    }

    setIntroResponses(prev => ({ ...prev, statusGroup: '', status: '' }));
  };

  const handleUniversityLevelChange = (selected) => {
    setIntroResponses(prev => ({
      ...prev,
      statusGroup: 'university',
      status: selected?.value || '',
      planUniversity: undefined,
      schoolScope: undefined,
      schoolScopeMapped: undefined,
      schoolSubjects: [],
      currentActivity: undefined,
    }));
  };

  const status = introResponses?.status || '';
  const statusGroup = getStatusGroupValue(introResponses);
  const isSchool = status === 'school';
  const isUniversityGroup = statusGroup === 'university';
  const isUni = status === 'undergraduate' || status === 'postgraduate';
  const isOther = status === 'other';

  const institutionLabel =
    isSchool ? 'Which school are you at?' :
    (isUni ? 'Which college or university are you at?' : '');

  const uniOptions = isUni ? getUniOptions(status) : [];

  // In the embedded / edit flow (the profile "re-run with new parameters"
  // modal) we surface validation errors immediately instead of waiting for the
  // field to be touched, so a missing required field is obvious rather than the
  // Re-run button being silently disabled.
  const hasErr = (key) => !!errors[key] && (isEditMode || !!touched[key]);
  const errMsg = (key) => hasErr(key) ? errors[key] : '';

  const hasEarlyGcseSubjectSelection = () => (
    shouldWarnAboutEarlySubjects() &&
    Array.isArray(introResponses.schoolSubjects) &&
    introResponses.schoolSubjects.length > 0
  );

  const handlePrimarySubmit = () => {
    if (hasEarlyGcseSubjectSelection() && !earlySubjectWarningAccepted) {
      setShowEarlySubjectWarning(true);
      setPendingEarlySubjectWarning(false);
      return;
    }

    if (typeof handleSubmit === 'function') {
      handleSubmit();
    }
  };

  return (
    <div className="intro-container">
      {!isEditMode && (
        <>
          <h2>Before we begin...</h2>
          <p className="intro-text">
            We’d love to ask a few quick questions to tailor your results and help us understand what you’d like CareerDNA to help you with.
            Your answers are used only to personalise your report and to collect anonymous, aggregated stats.
          </p>
        </>
      )}

      <div className={`field ${hasErr('country') ? 'has-error' : ''}`} id="countrySelect">
        <label className="required">Which country are you currently living in?</label>
        <Select
          classNamePrefix="introSelect"
          menuPlacement="bottom"
          menuShouldScrollIntoView={false}
          options={countryOptions}
          value={flatCountryOptions.find(opt => opt.value === introResponses.country) || null}
          onChange={selected => handleChange('country', selected ? selected.value : '')}
          onBlur={() => setFieldTouched('country')}
          placeholder="Select your country"
          aria-invalid={hasErr('country') ? 'true' : 'false'}
        />
        {hasErr('country') && <div className="error-text">{errMsg('country')}</div>}
      </div>

      {/* Date of birth is only asked on the first assessment. It is fixed after
          that (shown, non-editable, in Manage Account), so it does not appear
          when editing output parameters. */}
      {!isEditMode && (
        <div className={`field ${hasErr('dateOfBirth') ? 'has-error' : ''}`} id="dobField">
          <label className="required" htmlFor="dobInput">What is your date of birth?</label>
          <input
            id="dobInput"
            type="date"
            className="introDateInput"
            value={introResponses.dateOfBirth || ''}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => handleDobChange(e.target.value)}
            onFocus={() => setDobFocused(true)}
            onBlur={() => { setDobFocused(false); setFieldTouched('dateOfBirth'); }}
            aria-invalid={hasErr('dateOfBirth') ? 'true' : 'false'}
          />
          {dobFocused && (
            <div className="field-hint">
              Please enter your real date of birth. It is used to track your progression over time and cannot be
              changed afterwards.
            </div>
          )}
          {hasErr('dateOfBirth') && <div className="error-text">{errMsg('dateOfBirth')}</div>}
        </div>
      )}

      <div className={`field ${hasErr('status') ? 'has-error' : ''}`} id="statusSelect">
        <label className="required" htmlFor="statusSelect">What’s your current status?</label>
        <Select
            classNamePrefix="introSelect"
          menuPlacement="bottom"
          menuShouldScrollIntoView={false}
            options={statusOptions}
            value={statusOptions.find(opt => opt.value === statusGroup) || null}
            onChange={handleStatusGroupChange}
            onBlur={() => setFieldTouched('status')}
            placeholder="Select your current status"
              aria-invalid={hasErr('status') ? 'true' : 'false'}
        />
        {hasErr('status') && <div className="error-text">{errMsg('status')}</div>}
      </div>

      {isUniversityGroup && (
        <div className={`field ${hasErr('universityLevel') ? 'has-error' : ''}`} id="universityLevelSelect">
          <label className="required">Are you an undergraduate or postgraduate student?</label>
          <Select
            classNamePrefix="introSelect"
          menuPlacement="bottom"
          menuShouldScrollIntoView={false}
            options={universityLevelOptions}
            value={universityLevelOptions.find(opt => opt.value === status) || null}
            onChange={handleUniversityLevelChange}
            onBlur={() => setFieldTouched('universityLevel')}
            placeholder="Select your university level"
            isOptionDisabled={option => option.isDisabled}
            aria-invalid={hasErr('universityLevel') ? 'true' : 'false'}
              />
          
          {hasErr('universityLevel') && <div className="error-text">{errMsg('universityLevel')}</div>}
        </div>
      )}

      {isUni && (
        <div className={`field ${hasErr('courseYear') ? 'has-error' : ''}`} id="courseYearSelect">
          <label className="required">Which year of your course are you in?</label>
          <Select
            classNamePrefix="introSelect"
            menuPlacement="bottom"
            menuShouldScrollIntoView={false}
            options={courseYearOptions}
            value={courseYearOptions.find(opt => opt.value === introResponses.courseYear) || null}
            onChange={selected => handleCourseYearChange(selected.value)}
            onBlur={() => setFieldTouched('courseYear')}
            placeholder="Select your year"
            aria-invalid={hasErr('courseYear') ? 'true' : 'false'}
          />
          {hasErr('courseYear') && <div className="error-text">{errMsg('courseYear')}</div>}
        </div>
      )}

      {(isSchool || isUni) && (
        <div className={`field ${hasErr('institution') ? 'has-error' : ''}`}>
          <label htmlFor="institutionInput" className="required">{institutionLabel}</label>
          <input
            id="institutionInput"
            type="text"
            value={introResponses.institution || ''}
            onChange={e => handleChange('institution', e.target.value)}
            onBlur={() => setFieldTouched('institution')}
            placeholder={isSchool ? 'Type your school name' : 'Type your university name'}
            aria-invalid={hasErr('institution') ? 'true' : 'false'}
            aria-describedby={hasErr('institution') ? 'institutionError' : undefined}
          />
          {hasErr('institution') && <div id="institutionError" className="error-text">{errMsg('institution')}</div>}
        </div>
      )}

      {isOther && (
        <div className={`field ${hasErr('currentActivity') ? 'has-error' : ''}`}>
          <label htmlFor="otherActivityInput" className="required">What are you doing right now?</label>
          <input
            id="otherActivityInput"
            type="text"
            value={introResponses.currentActivity || ''}
            onChange={e => handleChange('currentActivity', e.target.value)}
            onBlur={() => setFieldTouched('currentActivity')}
            placeholder="e.g., Working, gap year, training course, not currently studying"
            aria-invalid={hasErr('currentActivity') ? 'true' : 'false'}
            aria-describedby={hasErr('currentActivity') ? 'currentActivityError' : undefined}
          />
          {hasErr('currentActivity') && <div id="currentActivityError" className="error-text">{errMsg('currentActivity')}</div>}
        </div>
      )}

      {(isSchool || isOther) && (
        <>
          {isSchool && (
            <div className={`field ${hasErr('schoolYear') ? 'has-error' : ''}`} id="schoolYearSelect">
              <label className="required">What year group are you in?</label>
              <Select
                classNamePrefix="introSelect"
                menuPlacement="bottom"
                menuShouldScrollIntoView={false}
                options={schoolYearOptions}
                value={schoolYearOptions.find(opt => opt.value === introResponses.schoolYear) || null}
                onChange={selected => handleChange('schoolYear', selected.value)}
                onBlur={() => setFieldTouched('schoolYear')}
                placeholder="Select your year group"
                aria-invalid={hasErr('schoolYear') ? 'true' : 'false'}
              />
              {hasErr('schoolYear') && <div className="error-text">{errMsg('schoolYear')}</div>}
            </div>
          )}

          <div className={`field ${hasErr('planUniversity') ? 'has-error' : ''}`}>
            <label className="required">Do you plan to go to university?</label>
            <Select
              classNamePrefix="introSelect"
          menuPlacement="bottom"
          menuShouldScrollIntoView={false}
                      options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unsure', label: 'Not sure yet' },
              ]}
              value={
                ['yes', 'no', 'unsure'].includes(introResponses.planUniversity)
                  ? {
                      value: introResponses.planUniversity,
                      label:
                        introResponses.planUniversity === 'unsure'
                          ? 'Not sure yet'
                          : introResponses.planUniversity.charAt(0).toUpperCase() +
                            introResponses.planUniversity.slice(1),
                    }
                  : null
              }
              onChange={selected => handleChange('planUniversity', selected.value)}
              onBlur={() => setFieldTouched('planUniversity')}
              placeholder="Do you plan to study at university?"
              aria-invalid={hasErr('planUniversity') ? 'true' : 'false'}
                    />
            {hasErr('planUniversity') && <div className="error-text">{errMsg('planUniversity')}</div>}
          </div>

          <div className={`field ${hasErr('schoolScope') ? 'has-error' : ''}`} id="schoolScopeSelect">
            <label className="required">What’s your next step right now?</label>
            <Select
              classNamePrefix="introSelect"
          menuPlacement="bottom"
          menuShouldScrollIntoView={false}
                      options={schoolScopeOptions}
              value={schoolScopeOptions.find(opt => opt.value === introResponses.schoolScope) || null}
              onChange={selected => handleChange('schoolScope', selected.value)}
              onBlur={() => setFieldTouched('schoolScope')}
              placeholder="Select your next step"
              aria-invalid={hasErr('schoolScope') ? 'true' : 'false'}
                    />
            {hasErr('schoolScope') && <div className="error-text">{errMsg('schoolScope')}</div>}
          </div>

          <div className={`field ${hasErr('schoolSubjects') ? 'has-error' : ''}`} id="schoolSubjects">
            <label>Which subjects interest you most? <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional, choose up to two)</span></label>
            <Select
              classNamePrefix="introSelect"
          menuPlacement="auto"
          menuShouldScrollIntoView
          filterOption={subjectStartsWithFilter}
                      isMulti
              options={schoolSubjectOptions}
              value={schoolSubjectOptions.filter(opt =>
                Array.isArray(introResponses.schoolSubjects)
                  ? introResponses.schoolSubjects.includes(opt.value)
                  : false
              )}
              onChange={handleSchoolSubjectsChange}
              onMenuClose={handleSchoolSubjectsMenuClose}
              isOptionDisabled={option =>
                Array.isArray(introResponses.schoolSubjects) &&
                introResponses.schoolSubjects.length >= 2 &&
                !introResponses.schoolSubjects.includes(option.value)
              }
              placeholder="Choose up to two subject interests"
              closeMenuOnSelect={false}
              onBlur={() => setFieldTouched('schoolSubjects')}
              aria-invalid={hasErr('schoolSubjects') ? 'true' : 'false'}
                    />
            {!isEditMode && !showEarlySubjectWarning && (
              <div className="subject-callout" role="status" aria-live="polite">
                Only include subjects if you already feel strongly about them. If you're open to discovering new possibilities,
                feel free to leave this blank and CareerDNA will help you explore your full potential.
              </div>
            )}
            {showEarlySubjectWarning && (
              <div className="early-subject-warning" role="alertdialog" aria-live="polite">
                <div className="early-subject-warning__copy">
                  <strong>It may be a little early to narrow this down.</strong>
                  <p>
                    Because you are choosing or studying GCSEs, you do not need to select subjects yet unless you already feel strongly about them. Leaving this blank can help CareerDNA map your wider strengths, interests and possibilities more openly.
                  </p>
                </div>
                <div className="early-subject-warning__actions">
                  <button type="button" className="early-subject-warning__secondary" onClick={clearEarlySubjectChoices}>
                    Leave blank
                  </button>
                  <button type="button" className="early-subject-warning__primary" onClick={dismissEarlySubjectWarning}>
                    Keep my choice
                  </button>
                </div>
              </div>
            )}
            {hasErr('schoolSubjects') && <div className="error-text">{errMsg('schoolSubjects')}</div>}
          </div>
        </>
      )}

      {isUni && (
        <>
          <div className={`field ${hasErr('uniNeed') ? 'has-error' : ''}`} id="uniScopeSelect">
            <label className="required">What’s your next step right now?</label>
            <Select
              classNamePrefix="introSelect"
          menuPlacement="bottom"
          menuShouldScrollIntoView={false}
                      options={uniOptions}
              value={uniOptions.find(opt => opt.value === introResponses.uniNeed) || null}
              onChange={selected => handleChange('uniNeed', selected.value)}
              onBlur={() => setFieldTouched('uniNeed')}
              placeholder="Select your next step"
              aria-invalid={hasErr('uniNeed') ? 'true' : 'false'}
                    />
            {hasErr('uniNeed') && <div className="error-text">{errMsg('uniNeed')}</div>}
          </div>

          <div className={`field ${hasErr('uniSubject') ? 'has-error' : ''}`} id="uniSubjectSelect">
            <label className="required">What subject are you studying (or did you study)?</label>
            <Select
              classNamePrefix="introSelect"
          menuPlacement="auto"
          menuShouldScrollIntoView
          filterOption={subjectStartsWithFilter}
                      options={universitySubjectOptions}
              value={universitySubjectOptions.find(opt => opt.value === introResponses.uniSubject) || null}
              onChange={selected => handleChange('uniSubject', selected ? selected.value : '')}
              onBlur={() => setFieldTouched('uniSubject')}
              placeholder="Choose your university subject"
              isClearable
              aria-invalid={hasErr('uniSubject') ? 'true' : 'false'}
                    />
            {hasErr('uniSubject') && <div className="error-text">{errMsg('uniSubject')}</div>}
          </div>
        </>
      )}

      <div className="intro-start-wrap">
        {showBackButton && typeof onBack === 'function' && (
          <Button
            type="secondary"
            size="lg"
            onClick={onBack}
            disabled={isLoading}
            aria-label="Cancel"
          >
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          size="lg"
          shine
          onClick={handlePrimarySubmit}
          disabled={!isComplete || isLoading || typeof handleSubmit !== 'function'}
          aria-label={finalSubmitLabel}
        >
          {finalSubmitLabel}
        </Button>
      </div>
      {isEditMode && !isComplete && !isLoading && (
        <p className="intro-required-hint" role="alert">
          Please complete the highlighted fields above to continue.
        </p>
      )}
    </div>
  );
};

export default IntroQuestions;
