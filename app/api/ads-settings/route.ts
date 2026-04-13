import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for admin operations to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Try to get the first ads_settings record
    const { data, error } = await supabaseAdmin
      .from("ads_settings")
      .select("show_ads, id")
      .limit(1);
    
    if (error) {
      console.error("Ads settings GET error:", error);
      return NextResponse.json({ show_ads: false }, { status: 200 });
    }
    
    // Return the first record if it exists, otherwise return default
    if (data && data.length > 0) {
      return NextResponse.json({ show_ads: data[0].show_ads, id: data[0].id });
    }
    
    // Create a default record if none exists
    const { data: newRecord, error: createError } = await supabaseAdmin
      .from("ads_settings")
      .insert({ show_ads: false })
      .select()
      .single();
    
    if (createError) {
      console.error("Ads settings creation error:", createError);
      return NextResponse.json({ show_ads: false }, { status: 200 });
    }
    
    return NextResponse.json({ show_ads: newRecord?.show_ads ?? false, id: newRecord?.id });
  } catch (e) {
    console.error("Ads settings GET error:", e);
    return NextResponse.json({ show_ads: false }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { show_ads } = await req.json();
    
    console.log("POST request received with show_ads:", show_ads);
    
    // Get all existing records to find the first one to update
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("ads_settings")
      .select("id");
    
    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch current settings" }, { status: 500 });
    }
    
    console.log("Existing records found:", existing?.length || 0);
    
    if (existing && existing.length > 0) {
      // Update the first existing record
      const recordId = existing[0].id;
      console.log("Updating record ID:", recordId, "to show_ads:", show_ads);
      
      const { error: updateError, data: updateData, status: updateStatus } = await supabaseAdmin
        .from("ads_settings")
        .update({ show_ads, updated_at: new Date().toISOString() })
        .eq("id", recordId)
        .select();
      
      console.log("Update response - status:", updateStatus, "error:", updateError, "data:", updateData);
      
      if (updateError) {
        console.error("Update error details:", updateError);
        return NextResponse.json({ 
          error: "Failed to update settings: " + updateError.message,
          details: updateError
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        show_ads, 
        updated: true, 
        data: updateData,
        message: "Settings updated successfully"
      });
    } else {
      // Create new record if none exists
      console.log("No existing records, creating new one with show_ads:", show_ads);
      
      const { error: insertError, data: insertData, status: insertStatus } = await supabaseAdmin
        .from("ads_settings")
        .insert({ show_ads })
        .select();
      
      console.log("Insert response - status:", insertStatus, "error:", insertError, "data:", insertData);
      
      if (insertError) {
        console.error("Insert error details:", insertError);
        return NextResponse.json({ 
          error: "Failed to create settings: " + insertError.message,
          details: insertError
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        show_ads, 
        created: true, 
        data: insertData,
        message: "Settings created successfully"
      });
    }
  } catch (e) {
    console.error("Ads settings POST error:", e);
    return NextResponse.json({ 
      error: "Internal server error: " + String(e)
    }, { status: 500 });
  }
}
