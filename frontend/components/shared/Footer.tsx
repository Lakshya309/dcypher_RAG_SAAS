import React from 'react';
import Link from 'next/link';
import { Globe, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          
          {/* Copyright Section */}
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Cypher Inc. All rights reserved.
            </p>
          </div>

          {/* Center/Right Section Wrapper */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            {/* Separator for desktop (hidden on mobile) */}
            <div className="hidden h-4 w-px bg-border sm:block" />

            {/* Social Icons */}
            
              <a 
                href="https://github.com/Lakshya309" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-10 w-10" />
              </a>
              
              <a 
                href="https://www.linkedin.com/in/lakshyatekwani" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-10 w-10" />
              </a>

              <a 
                href="mailto:lakshya.tekwani0309@gmail.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-10 w-10" />
              </a>
            </div>

          </div>
        </div>
      
    </footer>
  );
};

export default Footer;
